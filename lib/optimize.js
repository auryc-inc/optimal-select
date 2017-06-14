'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = optimize;

var _adapt = require('./adapt');

var _adapt2 = _interopRequireDefault(_adapt);

var _utilities = require('./utilities');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Apply different optimization techniques
 *
 * @param  {string}                          selector - [description]
 * @param  {HTMLElement|Array.<HTMLElement>} element  - [description]
 * @param  {Object}                          options  - [description]
 * @return {string}                                   - [description]
 */
/**
 * # Optimize
 *
 * 1.) Improve efficiency through shorter selectors by removing redundancy
 * 2.) Improve robustness through selector transformation
 */

function optimize(selector, elements) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};


  // convert single entry and NodeList
  if (!Array.isArray(elements)) {
    elements = !elements.length ? [elements] : (0, _utilities.convertNodeList)(elements);
  }

  if (!elements.length || elements.some(function (element) {
    return element.nodeType !== 1;
  })) {
    throw new Error('Invalid input - to compare HTMLElements its necessary to provide a reference of the selected node(s)! (missing "elements")');
  }

  var globalModified = (0, _adapt2.default)(elements[0], options);

  var path;
  if (!Array.isArray(selector)) {
    // chunk parts outside of quotes (http://stackoverflow.com/a/25663729)
    path = selector.replace(/> /g, '>').split(/\s+(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  } else {
    path = selector;
  }

  if (path.length < 2) {
    return optimizePart('', selector, '', elements);
  }

  var shortened = [path.pop()];
  while (path.length > 1) {
    var current = path.pop();
    var prePart = path.join(' ');
    var postPart = shortened.join(' ');

    var pattern = prePart + ' ' + postPart;
    var matches = document.querySelectorAll(pattern);
    if (matches.length !== elements.length) {
      shortened.unshift(optimizePart(prePart, current, postPart, elements));
    }
  }
  shortened.unshift(path[0]);
  path = shortened;

  // optimize start + end
  path[0] = optimizePart('', path[0], path.slice(1).join(' '), elements);
  path[path.length - 1] = optimizePart(path.slice(0, -1).join(' '), path[path.length - 1], '', elements);

  if (globalModified) {
    delete global.document;
  }

  return path.join(' ').replace(/>/g, '> ').trim();
}

/**
 * Improve a chunk of the selector
 *
 * @param  {string}              prePart  - [description]
 * @param  {string}              current  - [description]
 * @param  {string}              postPart - [description]
 * @param  {Array.<HTMLElement>} elements - [description]
 * @return {string}                       - [description]
 */
function optimizePart(prePart, current, postPart, elements) {
  if (prePart.length) prePart = prePart + ' ';
  if (postPart.length) postPart = ' ' + postPart;

  // robustness: attribute without value (generalization)
  if (/\[*\]/.test(current)) {
    var key = current.replace(/=.*$/, ']');
    var pattern = '' + prePart + key + postPart;
    var matches = document.querySelectorAll(pattern);
    if (compareResults(matches, elements)) {
      current = key;
    } else {
      // robustness: replace specific key-value with base tag (heuristic)
      var references = document.querySelectorAll('' + prePart + key);

      var _loop = function _loop() {
        var reference = references[i];
        if (elements.some(function (element) {
          return reference.contains(element);
        })) {
          var description = reference.tagName.toLowerCase();
          pattern = '' + prePart + description + postPart;
          matches = document.querySelectorAll(pattern);

          if (compareResults(matches, elements)) {
            current = description;
          }
          return 'break';
        }
      };

      for (var i = 0, l = references.length; i < l; i++) {
        var pattern;
        var matches;

        var _ret = _loop();

        if (_ret === 'break') break;
      }
    }
  }

  // robustness: descendant instead child (heuristic)
  if (/>/.test(current)) {
    var descendant = current.replace(/>/, '');
    var pattern = '' + prePart + descendant + postPart;
    var matches = document.querySelectorAll(pattern);
    if (compareResults(matches, elements)) {
      current = descendant;
    }
  }

  // robustness: 'nth-of-type' instead 'nth-child' (heuristic)
  if (/:nth-child/.test(current)) {
    // TODO: consider complete coverage of 'nth-of-type' replacement
    var type = current.replace(/nth-child/g, 'nth-of-type');
    var pattern = '' + prePart + type + postPart;
    var matches = document.querySelectorAll(pattern);
    if (compareResults(matches, elements)) {
      current = type;
    }
  }

  // efficiency: combinations of classname (partial permutations)
  if (/\.\S+\.\S+/.test(current)) {
    var names = current.trim().split('.').slice(1).map(function (name) {
      return '.' + name;
    }).sort(function (curr, next) {
      return curr.length - next.length;
    });
    while (names.length) {
      var partial = current.replace(names.shift(), '').trim();
      var pattern = ('' + prePart + partial + postPart).trim();
      if (!pattern.length || pattern.charAt(0) === '>' || pattern.charAt(pattern.length - 1) === '>') {
        break;
      }
      var matches = document.querySelectorAll(pattern);
      if (compareResults(matches, elements)) {
        current = partial;
      }
    }

    // robustness: degrade complex classname (heuristic)
    names = current && current.match(/\./g);
    if (names && names.length > 2) {
      var _references = document.querySelectorAll('' + prePart + current);

      var _loop2 = function _loop2() {
        var reference = _references[i];
        if (elements.some(function (element) {
          return reference.contains(element);
        })) {
          // TODO:
          // - check using attributes + regard excludes
          var description = reference.tagName.toLowerCase();
          pattern = '' + prePart + description + postPart;
          matches = document.querySelectorAll(pattern);

          if (compareResults(matches, elements)) {
            current = description;
          }
          return 'break';
        }
      };

      for (var i = 0, l = _references.length; i < l; i++) {
        var pattern;
        var matches;

        var _ret2 = _loop2();

        if (_ret2 === 'break') break;
      }
    }
  }

  return current;
}

/**
 * Evaluate matches with expected elements
 *
 * @param  {Array.<HTMLElement>} matches  - [description]
 * @param  {Array.<HTMLElement>} elements - [description]
 * @return {Boolean}                      - [description]
 */
function compareResults(matches, elements) {
  var length = matches.length;

  return length === elements.length && elements.every(function (element) {
    for (var i = 0; i < length; i++) {
      if (matches[i] === element) {
        return true;
      }
    }
    return false;
  });
}
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm9wdGltaXplLmpzIl0sIm5hbWVzIjpbIm9wdGltaXplIiwic2VsZWN0b3IiLCJlbGVtZW50cyIsIm9wdGlvbnMiLCJBcnJheSIsImlzQXJyYXkiLCJsZW5ndGgiLCJzb21lIiwiZWxlbWVudCIsIm5vZGVUeXBlIiwiRXJyb3IiLCJnbG9iYWxNb2RpZmllZCIsInBhdGgiLCJyZXBsYWNlIiwic3BsaXQiLCJvcHRpbWl6ZVBhcnQiLCJzaG9ydGVuZWQiLCJwb3AiLCJjdXJyZW50IiwicHJlUGFydCIsImpvaW4iLCJwb3N0UGFydCIsInBhdHRlcm4iLCJtYXRjaGVzIiwiZG9jdW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwidW5zaGlmdCIsInNsaWNlIiwiZ2xvYmFsIiwidHJpbSIsInRlc3QiLCJrZXkiLCJjb21wYXJlUmVzdWx0cyIsInJlZmVyZW5jZXMiLCJyZWZlcmVuY2UiLCJpIiwiY29udGFpbnMiLCJkZXNjcmlwdGlvbiIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsImwiLCJkZXNjZW5kYW50IiwidHlwZSIsIm5hbWVzIiwibWFwIiwibmFtZSIsInNvcnQiLCJjdXJyIiwibmV4dCIsInBhcnRpYWwiLCJzaGlmdCIsImNoYXJBdCIsIm1hdGNoIiwiZXZlcnkiXSwibWFwcGluZ3MiOiI7Ozs7O2tCQWtCd0JBLFE7O0FBWHhCOzs7O0FBQ0E7Ozs7QUFFQTs7Ozs7Ozs7QUFWQTs7Ozs7OztBQWtCZSxTQUFTQSxRQUFULENBQW1CQyxRQUFuQixFQUE2QkMsUUFBN0IsRUFBcUQ7QUFBQSxNQUFkQyxPQUFjLHVFQUFKLEVBQUk7OztBQUVsRTtBQUNBLE1BQUksQ0FBQ0MsTUFBTUMsT0FBTixDQUFjSCxRQUFkLENBQUwsRUFBOEI7QUFDNUJBLGVBQVcsQ0FBQ0EsU0FBU0ksTUFBVixHQUFtQixDQUFDSixRQUFELENBQW5CLEdBQWdDLGdDQUFnQkEsUUFBaEIsQ0FBM0M7QUFDRDs7QUFFRCxNQUFJLENBQUNBLFNBQVNJLE1BQVYsSUFBb0JKLFNBQVNLLElBQVQs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L0M7QUFFSDtBQUNGO0FBQ0Y7O0FBRUQsU0FBT0wsT0FBUDtBQUNEOztBQUVEOzs7Ozs7O0FBT0EsU0FBU2MsY0FBVCxDQUF5QlQsT0FBekIsRUFBa0NyQixRQUFsQyxFQUE0QztBQUFBLE1BQ2xDSSxNQURrQyxHQUN2QmlCLE9BRHVCLENBQ2xDakIsTUFEa0M7O0FBRTFDLFNBQU9BLFdBQVdKLFNBQVNJLE1BQXBCLElBQThCSixTQUFTbUQsS0FBVCxDQUFlLFVBQUM3QyxPQUFELEVBQWE7QUFDL0QsU0FBSyxJQUFJMkIsSUFBSSxDQUFiLEVBQWdCQSxJQUFJN0IsTUFBcEIsRUFBNEI2QixHQUE1QixFQUFpQztBQUMvQixVQUFJWixRQUFRWSxDQUFSLE1BQWUzQixPQUFuQixFQUE0QjtBQUMxQixlQUFPLElBQVA7QUFDRDtBQUNGO0FBQ0QsV0FBTyxLQUFQO0FBQ0QsR0FQb0MsQ0FBckM7QUFRRCIsImZpbGUiOiJvcHRpbWl6ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogIyBPcHRpbWl6ZVxuICpcbiAqIDEuKSBJbXByb3ZlIGVmZmljaWVuY3kgdGhyb3VnaCBzaG9ydGVyIHNlbGVjdG9ycyBieSByZW1vdmluZyByZWR1bmRhbmN5XG4gKiAyLikgSW1wcm92ZSByb2J1c3RuZXNzIHRocm91Z2ggc2VsZWN0b3IgdHJhbnNmb3JtYXRpb25cbiAqL1xuXG5pbXBvcnQgYWRhcHQgZnJvbSAnLi9hZGFwdCdcbmltcG9ydCB7IGNvbnZlcnROb2RlTGlzdCB9IGZyb20gJy4vdXRpbGl0aWVzJ1xuXG4vKipcbiAqIEFwcGx5IGRpZmZlcmVudCBvcHRpbWl6YXRpb24gdGVjaG5pcXVlc1xuICpcbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdG9yIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7SFRNTEVsZW1lbnR8QXJyYXkuPEhUTUxFbGVtZW50Pn0gZWxlbWVudCAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zICAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBvcHRpbWl6ZSAoc2VsZWN0b3IsIGVsZW1lbnRzLCBvcHRpb25zID0ge30pIHtcblxuICAvLyBjb252ZXJ0IHNpbmdsZSBlbnRyeSBhbmQgTm9kZUxpc3RcbiAgaWYgKCFBcnJheS5pc0FycmF5KGVsZW1lbnRzKSkge1xuICAgIGVsZW1lbnRzID0gIWVsZW1lbnRzLmxlbmd0aCA/IFtlbGVtZW50c10gOiBjb252ZXJ0Tm9kZUxpc3QoZWxlbWVudHMpXG4gIH1cblxuICBpZiAoIWVsZW1lbnRzLmxlbmd0aCB8fCBlbGVtZW50cy5zb21lKChlbGVtZW50KSA9PiBlbGVtZW50Lm5vZGVUeXBlICE9PSAxKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBpbnB1dCAtIHRvIGNvbXBhcmUgSFRNTEVsZW1lbnRzIGl0cyBuZWNlc3NhcnkgdG8gcHJvdmlkZSBhIHJlZmVyZW5jZSBvZiB0aGUgc2VsZWN0ZWQgbm9kZShzKSEgKG1pc3NpbmcgXCJlbGVtZW50c1wiKWApXG4gIH1cblxuICBjb25zdCBnbG9iYWxNb2RpZmllZCA9IGFkYXB0KGVsZW1lbnRzWzBdLCBvcHRpb25zKVxuXG4gIHZhciBwYXRoO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoc2VsZWN0b3IpKSB7XG4gICAgLy8gY2h1bmsgcGFydHMgb3V0c2lkZSBvZiBxdW90ZXMgKGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzI1NjYzNzI5KVxuICAgIHBhdGggPSBzZWxlY3Rvci5yZXBsYWNlKC8+IC9nLCAnPicpLnNwbGl0KC9cXHMrKD89KD86KD86W15cIl0qXCIpezJ9KSpbXlwiXSokKS8pXG4gIH0gZWxzZSB7XG4gICAgcGF0aCA9IHNlbGVjdG9yO1xuICB9XG5cbiAgaWYgKHBhdGgubGVuZ3RoIDwgMikge1xuICAgIHJldHVybiBvcHRpbWl6ZVBhcnQoJycsIHNlbGVjdG9yLCAnJywgZWxlbWVudHMpXG4gIH1cblxuICBjb25zdCBzaG9ydGVuZWQgPSBbcGF0aC5wb3AoKV1cbiAgd2hpbGUgKHBhdGgubGVuZ3RoID4gMSkgIHtcbiAgICBjb25zdCBjdXJyZW50ID0gcGF0aC5wb3AoKVxuICAgIGNvbnN0IHByZVBhcnQgPSBwYXRoLmpvaW4oJyAnKVxuICAgIGNvbnN0IHBvc3RQYXJ0ID0gc2hvcnRlbmVkLmpvaW4oJyAnKVxuXG4gICAgY29uc3QgcGF0dGVybiA9IGAke3ByZVBhcnR9ICR7cG9zdFBhcnR9YFxuICAgIGNvbnN0IG1hdGNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgaWYgKG1hdGNoZXMubGVuZ3RoICE9PSBlbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgIHNob3J0ZW5lZC51bnNoaWZ0KG9wdGltaXplUGFydChwcmVQYXJ0LCBjdXJyZW50LCBwb3N0UGFydCwgZWxlbWVudHMpKVxuICAgIH1cbiAgfVxuICBzaG9ydGVuZWQudW5zaGlmdChwYXRoWzBdKVxuICBwYXRoID0gc2hvcnRlbmVkXG5cbiAgLy8gb3B0aW1pemUgc3RhcnQgKyBlbmRcbiAgcGF0aFswXSA9IG9wdGltaXplUGFydCgnJywgcGF0aFswXSwgcGF0aC5zbGljZSgxKS5qb2luKCcgJyksIGVsZW1lbnRzKVxuICBwYXRoW3BhdGgubGVuZ3RoLTFdID0gb3B0aW1pemVQYXJ0KHBhdGguc2xpY2UoMCwgLTEpLmpvaW4oJyAnKSwgcGF0aFtwYXRoLmxlbmd0aC0xXSwgJycsIGVsZW1lbnRzKVxuXG4gIGlmIChnbG9iYWxNb2RpZmllZCkge1xuICAgIGRlbGV0ZSBnbG9iYWwuZG9jdW1lbnRcbiAgfVxuXG4gIHJldHVybiBwYXRoLmpvaW4oJyAnKS5yZXBsYWNlKC8+L2csICc+ICcpLnRyaW0oKVxufVxuXG4vKipcbiAqIEltcHJvdmUgYSBjaHVuayBvZiB0aGUgc2VsZWN0b3JcbiAqXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICAgICAgICAgICAgICBwcmVQYXJ0ICAtIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge3N0cmluZ30gICAgICAgICAgICAgIGN1cnJlbnQgIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7c3RyaW5nfSAgICAgICAgICAgICAgcG9zdFBhcnQgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheS48SFRNTEVsZW1lbnQ+fSBlbGVtZW50cyAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBvcHRpbWl6ZVBhcnQgKHByZVBhcnQsIGN1cnJlbnQsIHBvc3RQYXJ0LCBlbGVtZW50cykge1xuICBpZiAocHJlUGFydC5sZW5ndGgpIHByZVBhcnQgPSBgJHtwcmVQYXJ0fSBgXG4gIGlmIChwb3N0UGFydC5sZW5ndGgpIHBvc3RQYXJ0ID0gYCAke3Bvc3RQYXJ0fWBcblxuICAvLyByb2J1c3RuZXNzOiBhdHRyaWJ1dGUgd2l0aG91dCB2YWx1ZSAoZ2VuZXJhbGl6YXRpb24pXG4gIGlmICgvXFxbKlxcXS8udGVzdChjdXJyZW50KSkge1xuICAgIGNvbnN0IGtleSA9IGN1cnJlbnQucmVwbGFjZSgvPS4qJC8sICddJylcbiAgICB2YXIgcGF0dGVybiA9IGAke3ByZVBhcnR9JHtrZXl9JHtwb3N0UGFydH1gXG4gICAgdmFyIG1hdGNoZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHBhdHRlcm4pXG4gICAgaWYgKGNvbXBhcmVSZXN1bHRzKG1hdGNoZXMsIGVsZW1lbnRzKSkge1xuICAgICAgY3VycmVudCA9IGtleVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyByb2J1c3RuZXNzOiByZXBsYWNlIHNwZWNpZmljIGtleS12YWx1ZSB3aXRoIGJhc2UgdGFnIChoZXVyaXN0aWMpXG4gICAgICBjb25zdCByZWZlcmVuY2VzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgJHtwcmVQYXJ0fSR7a2V5fWApXG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHJlZmVyZW5jZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHJlZmVyZW5jZSA9IHJlZmVyZW5jZXNbaV1cbiAgICAgICAgaWYgKGVsZW1lbnRzLnNvbWUoKGVsZW1lbnQpID0+IHJlZmVyZW5jZS5jb250YWlucyhlbGVtZW50KSkpIHtcbiAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHJlZmVyZW5jZS50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICB2YXIgcGF0dGVybiA9IGAke3ByZVBhcnR9JHtkZXNjcmlwdGlvbn0ke3Bvc3RQYXJ0fWBcbiAgICAgICAgICB2YXIgbWF0Y2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICAgICAgICBpZiAoY29tcGFyZVJlc3VsdHMobWF0Y2hlcywgZWxlbWVudHMpKSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gZGVzY3JpcHRpb25cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIHJvYnVzdG5lc3M6IGRlc2NlbmRhbnQgaW5zdGVhZCBjaGlsZCAoaGV1cmlzdGljKVxuICBpZiAoLz4vLnRlc3QoY3VycmVudCkpIHtcbiAgICBjb25zdCBkZXNjZW5kYW50ID0gY3VycmVudC5yZXBsYWNlKC8+LywgJycpXG4gICAgdmFyIHBhdHRlcm4gPSBgJHtwcmVQYXJ0fSR7ZGVzY2VuZGFudH0ke3Bvc3RQYXJ0fWBcbiAgICB2YXIgbWF0Y2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICBpZiAoY29tcGFyZVJlc3VsdHMobWF0Y2hlcywgZWxlbWVudHMpKSB7XG4gICAgICBjdXJyZW50ID0gZGVzY2VuZGFudFxuICAgIH1cbiAgfVxuXG4gIC8vIHJvYnVzdG5lc3M6ICdudGgtb2YtdHlwZScgaW5zdGVhZCAnbnRoLWNoaWxkJyAoaGV1cmlzdGljKVxuICBpZiAoLzpudGgtY2hpbGQvLnRlc3QoY3VycmVudCkpIHtcbiAgICAvLyBUT0RPOiBjb25zaWRlciBjb21wbGV0ZSBjb3ZlcmFnZSBvZiAnbnRoLW9mLXR5cGUnIHJlcGxhY2VtZW50XG4gICAgY29uc3QgdHlwZSA9IGN1cnJlbnQucmVwbGFjZSgvbnRoLWNoaWxkL2csICdudGgtb2YtdHlwZScpXG4gICAgdmFyIHBhdHRlcm4gPSBgJHtwcmVQYXJ0fSR7dHlwZX0ke3Bvc3RQYXJ0fWBcbiAgICB2YXIgbWF0Y2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICBpZiAoY29tcGFyZVJlc3VsdHMobWF0Y2hlcywgZWxlbWVudHMpKSB7XG4gICAgICBjdXJyZW50ID0gdHlwZVxuICAgIH1cbiAgfVxuXG4gIC8vIGVmZmljaWVuY3k6IGNvbWJpbmF0aW9ucyBvZiBjbGFzc25hbWUgKHBhcnRpYWwgcGVybXV0YXRpb25zKVxuICBpZiAoL1xcLlxcUytcXC5cXFMrLy50ZXN0KGN1cnJlbnQpKSB7XG4gICAgdmFyIG5hbWVzID0gY3VycmVudC50cmltKCkuc3BsaXQoJy4nKS5zbGljZSgxKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAubWFwKChuYW1lKSA9PiBgLiR7bmFtZX1gKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc29ydCgoY3VyciwgbmV4dCkgPT4gY3Vyci5sZW5ndGggLSBuZXh0Lmxlbmd0aClcbiAgICB3aGlsZSAobmFtZXMubGVuZ3RoKSB7XG4gICAgICBjb25zdCBwYXJ0aWFsID0gY3VycmVudC5yZXBsYWNlKG5hbWVzLnNoaWZ0KCksICcnKS50cmltKClcbiAgICAgIHZhciBwYXR0ZXJuID0gYCR7cHJlUGFydH0ke3BhcnRpYWx9JHtwb3N0UGFydH1gLnRyaW0oKVxuICAgICAgaWYgKCFwYXR0ZXJuLmxlbmd0aCB8fCBwYXR0ZXJuLmNoYXJBdCgwKSA9PT0gJz4nIHx8IHBhdHRlcm4uY2hhckF0KHBhdHRlcm4ubGVuZ3RoLTEpID09PSAnPicpIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cbiAgICAgIHZhciBtYXRjaGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChwYXR0ZXJuKVxuICAgICAgaWYgKGNvbXBhcmVSZXN1bHRzKG1hdGNoZXMsIGVsZW1lbnRzKSkge1xuICAgICAgICBjdXJyZW50ID0gcGFydGlhbFxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHJvYnVzdG5lc3M6IGRlZ3JhZGUgY29tcGxleCBjbGFzc25hbWUgKGhldXJpc3RpYylcbiAgICBuYW1lcyA9IGN1cnJlbnQgJiYgY3VycmVudC5tYXRjaCgvXFwuL2cpXG4gICAgaWYgKG5hbWVzICYmIG5hbWVzLmxlbmd0aCA+IDIpIHtcbiAgICAgIGNvbnN0IHJlZmVyZW5jZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAke3ByZVBhcnR9JHtjdXJyZW50fWApXG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHJlZmVyZW5jZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHJlZmVyZW5jZSA9IHJlZmVyZW5jZXNbaV1cbiAgICAgICAgaWYgKGVsZW1lbnRzLnNvbWUoKGVsZW1lbnQpID0+IHJlZmVyZW5jZS5jb250YWlucyhlbGVtZW50KSApKSB7XG4gICAgICAgICAgLy8gVE9ETzpcbiAgICAgICAgICAvLyAtIGNoZWNrIHVzaW5nIGF0dHJpYnV0ZXMgKyByZWdhcmQgZXhjbHVkZXNcbiAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHJlZmVyZW5jZS50YWdOYW1lLnRvTG93ZXJDYXNlKClcbiAgICAgICAgICB2YXIgcGF0dGVybiA9IGAke3ByZVBhcnR9JHtkZXNjcmlwdGlvbn0ke3Bvc3RQYXJ0fWBcbiAgICAgICAgICB2YXIgbWF0Y2hlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocGF0dGVybilcbiAgICAgICAgICBpZiAoY29tcGFyZVJlc3VsdHMobWF0Y2hlcywgZWxlbWVudHMpKSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gZGVzY3JpcHRpb25cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjdXJyZW50XG59XG5cbi8qKlxuICogRXZhbHVhdGUgbWF0Y2hlcyB3aXRoIGV4cGVjdGVkIGVsZW1lbnRzXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPEhUTUxFbGVtZW50Pn0gbWF0Y2hlcyAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtBcnJheS48SFRNTEVsZW1lbnQ+fSBlbGVtZW50cyAtIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBjb21wYXJlUmVzdWx0cyAobWF0Y2hlcywgZWxlbWVudHMpIHtcbiAgY29uc3QgeyBsZW5ndGggfSA9IG1hdGNoZXNcbiAgcmV0dXJuIGxlbmd0aCA9PT0gZWxlbWVudHMubGVuZ3RoICYmIGVsZW1lbnRzLmV2ZXJ5KChlbGVtZW50KSA9PiB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKG1hdGNoZXNbaV0gPT09IGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlXG4gIH0pXG59XG4iXX0=
