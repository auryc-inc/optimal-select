'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /**
                                                                                                                                                                                                                                                                               * # Select
                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                               * Construct a unique CSS query selector to access the selected DOM element(s).
                                                                                                                                                                                                                                                                               * For longevity it applies different matching and optimization strategies.
                                                                                                                                                                                                                                                                               */


exports.getSingleSelector = getSingleSelector;
exports.getMultiSelector = getMultiSelector;
exports.default = getQuerySelector;

var _css = require('css.escape');

var _css2 = _interopRequireDefault(_css);

var _adapt = require('./adapt');

var _adapt2 = _interopRequireDefault(_adapt);

var _match = require('./match');

var _match2 = _interopRequireDefault(_match);

var _optimize = require('./optimize');

var _optimize2 = _interopRequireDefault(_optimize);

var _utilities = require('./utilities');

var _common = require('./common');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Get a selector for the provided element
 *
 * @param  {HTMLElement} element - [description]
 * @param  {Object}      options - [description]
 * @return {string}              - [description]
 */
function getSingleSelector(element) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


  if (element.nodeType === 3) {
    element = element.parentNode;
  }

  if (element.nodeType !== 1) {
    throw new Error('Invalid input - only HTMLElements or representations of them are supported! (not "' + (typeof element === 'undefined' ? 'undefined' : _typeof(element)) + '")');
  }

  var globalModified = (0, _adapt2.default)(element, options);

  var selector = (0, _match2.default)(element, options);
  var optimized = (0, _optimize2.default)(selector, element, options);

  // debug
  // console.log(`
  //   selector:  ${selector}
  //   optimized: ${optimized}
  // `)

  if (globalModified) {
    delete global.document;
  }

  return optimized;
}

/**
 * Get a selector to match multiple descendants from an ancestor
 *
 * @param  {Array.<HTMLElement>|NodeList} elements - [description]
 * @param  {Object}                       options  - [description]
 * @return {string}                                - [description]
 */
function getMultiSelector(elements) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};


  if (!Array.isArray(elements)) {
    elements = (0, _utilities.convertNodeList)(elements);
  }

  if (elements.some(function (element) {
    return element.nodeType !== 1;
  })) {
    throw new Error('Invalid input - only an Array of HTMLElements or representations of them is supported!');
  }

  var globalModified = (0, _adapt2.default)(elements[0], options);

  var ancestor = (0, _common.getCommonAncestor)(elements, options);
  var ancestorSelector = getSingleSelector(ancestor, options);

  // TODO: consider usage of multiple selectors + parent-child relation + check for part redundancy
  var commonSelectors = getCommonSelectors(elements, options);
  var descendantSelector = commonSelectors[0];

  var selector = (0, _optimize2.default)([ancestorSelector, descendantSelector], elements, options);
  var selectorMatches = (0, _utilities.convertNodeList)(document.querySelectorAll(selector));

  if (!elements.every(function (element) {
    return selectorMatches.some(function (entry) {
      return entry === element;
    });
  })) {
    // TODO: cluster matches to split into similar groups for sub selections
    /*
      return console.warn(`
        The selected elements can\'t be efficiently mapped.
        Its probably best to use multiple single selectors instead!
      `, elements)
    */
  }

  if (globalModified) {
    delete global.document;
  }

  return selector;
}

/**
 * Get selectors to describe a set of elements
 *
 * @param  {Array.<HTMLElements>} elements - [description]
 * @return {string}                        - [description]
 */
function getCommonSelectors(elements, options) {
  var ignore = options.ignore;

  var _getCommonProperties = (0, _common.getCommonProperties)(elements),
      classes = _getCommonProperties.classes,
      attributes = _getCommonProperties.attributes,
      tag = _getCommonProperties.tag;

  var selectorPath = [];

  if (tag) {
    if (!(0, _utilities.checkIgnore)(ignore.tag, null, tag)) {
      selectorPath.push(tag);
    }
  }

  if (classes) {
    var classSelector = classes.filter(function (name) {
      return !(0, _utilities.checkIgnore)(ignore.class, 'class', name);
    }).map(function (name) {
      return '.' + name;
    }).join('');
    selectorPath.push(classSelector);
  }

  if (attributes) {
    var attributeSelector = Object.keys(attributes).reduce(function (parts, name) {
      if (!(0, _utilities.checkIgnore)(ignore.attribute, name, attributes[name])) {
        parts.push('[' + name + '="' + (0, _css2.default)(attributes[name]) + '"]');
      }
      return parts;
    }, []).join('');
    selectorPath.push(attributeSelector);
  }

  if (selectorPath.length) {
    // TODO: check for parent-child relation
  }

  return [selectorPath.join('')];
}

/**
 * Choose action depending on the input (multiple/single)
 *
 * NOTE: extended detection is used for special cases like the <select> element with <options>
 *
 * @param  {HTMLElement|NodeList|Array.<HTMLElement>} input   - [description]
 * @param  {Object}                                   options - [description]
 * @return {string}                                           - [description]
 */
function getQuerySelector(input) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (input.length && !input.name) {
    return getMultiSelector(input, options);
  }
  return getSingleSelector(input, options);
}
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlbGVjdC5qcyJdLCJuYW1lcyI6WyJnZXRTaW5nbGVTZWxlY3RvciIsImdldE11bHRpU2VsZWN0b3IiLCJnZXRRdWVyeVNlbGVjdG9yIiwiZWxlbWVudCIsIm9wdGlvbnMiLCJub2RlVHlwZSIsInBhcmVudE5vZGUiLCJFcnJvciIsImdsb2JhbE1vZGlmaWVkIiwic2VsZWN0b3IiLCJvcHRpbWl6ZWQiLCJnbG9iYWwiLCJkb2N1bWVudCIsImVsZW1lbnRzIiwiQXJyYXkiLCJpc0FycmF5Iiwic29tZSIsImFuY2VzdG9yIiwiYW5jZXN0b3JTZWxlY3RvciIsImNvbW1vblNlbGVjdG9ycyIsImdldENvbW1vblNlbGVjdG9ycyIsImRlc2NlbmRhbnRTZWxlY3RvciIsInNlbGVjdG9yTWF0Y2hlcyIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJldmVyeSIsImVudHJ5IiwiaWdub3JlIiwiY2xhc3NlcyIsImF0dHJpYnV0ZXMiLCJ0YWciLCJzZWxlY3RvclBhdGgiLCJwdXNoIiwiY2xhc3NTZWxlY3RvciIsImZpbHRlciIsIm5hbWUiLCJjbGFzcyIsIm1hcCIsImpvaW4iLCJhdHRyaWJ1dGVTZWxlY3RvciIsIk9iamVjdCIsImtleXMiLCJyZWR1Y2UiLCJwYXJ0cyIsImF0dHJpYnV0ZSIsImxlbmd0aCIsImlucHV0Il0sIm1hcHBpbmdzIjoiOzs7Ozs7OFFBQUE7Ozs7Ozs7O1FBb0JnQkEsaUIsR0FBQUEsaUI7UUFtQ0FDLGdCLEdBQUFBLGdCO2tCQTBGUUMsZ0I7O0FBM0l4Qjs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBRUE7Ozs7Ozs7QUFPTyxTQUFTRixpQkFBVCxDQUE0QkcsT0FBNUIsRUFBbUQ7QUFBQSxNQUFkQyxPQUFjLHVFQUFKLEVBQUk7OztBQUV4RCxNQUFJRCxRQUFRRSxRQUFSLEtBQXFCLENBQXpCLEVBQTRCO0FBQzFCRixjQUFVQSxRQUFRRyxVQUFsQjtBQUNEOztBQUVELE1BQUlILFFBQVFFLFFBQVIsS0FBcUIsQ0FB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Q0FBd0UsVUFBQ0YsSUFBRDtBQUFBLG1CQUFjQSxJQUFkO0FBQUEsS0FBeEUsRUFBOEZHLElBQTlGLENBQW1HLEVBQW5HLENBQXRCO0FBQ0FQLGlCQUFhQyxJQUFiLENBQWtCQyxhQUFsQjtBQUNEOztBQUVELE1BQUlKLFVBQUosRUFBZ0I7QUFDZCxRQUFNVSxvQkFBb0JDLE9BQU9DLElBQVAsQ0FBWVosVUFBWixFQUF3QmEsTUFBeEIsQ0FBK0IsVUFBQ0MsS0FBRCxFQUFRUixJQUFSLEVBQWlCO0FBQ3hFLFVBQUksQ0FBQyw0QkFBWVIsT0FBT2lCLFNBQW5CLEVBQThCVCxJQUE5QixFQUFvQ04sV0FBV00sSUFBWCxDQUFwQyxDQUFMLEVBQTREO0FBQzFEUSxjQUFNWCxJQUFOLE9BQWVHLElBQWYsVUFBd0IsbUJBQVVOLFdBQVdNLElBQVgsQ0FBVixDQUF4QjtBQUNEO0FBQ0QsYUFBT1EsS0FBUDtBQUNELEtBTHlCLEVBS3ZCLEVBTHVCLEVBS25CTCxJQUxtQixDQUtkLEVBTGMsQ0FBMUI7QUFNQVAsaUJBQWFDLElBQWIsQ0FBa0JPLGlCQUFsQjtBQUNEOztBQUVELE1BQUlSLGFBQWFjLE1BQWpCLEVBQXlCO0FBQ3ZCO0FBQ0Q7O0FBRUQsU0FBTyxDQUNMZCxhQUFhTyxJQUFiLENBQWtCLEVBQWxCLENBREssQ0FBUDtBQUdEOztBQUVEOzs7Ozs7Ozs7QUFTZSxTQUFTbkMsZ0JBQVQsQ0FBMkIyQyxLQUEzQixFQUFnRDtBQUFBLE1BQWR6QyxPQUFjLHVFQUFKLEVBQUk7O0FBQzdELE1BQUl5QyxNQUFNRCxNQUFOLElBQWdCLENBQUNDLE1BQU1YLElBQTNCLEVBQWlDO0FBQy9CLFdBQU9qQyxpQkFBaUI0QyxLQUFqQixFQUF3QnpDLE9BQXhCLENBQVA7QUFDRDtBQUNELFNBQU9KLGtCQUFrQjZDLEtBQWxCLEVBQXlCekMsT0FBekIsQ0FBUDtBQUNEIiwiZmlsZSI6InNlbGVjdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogIyBTZWxlY3RcbiAqXG4gKiBDb25zdHJ1Y3QgYSB1bmlxdWUgQ1NTIHF1ZXJ5IHNlbGVjdG9yIHRvIGFjY2VzcyB0aGUgc2VsZWN0ZWQgRE9NIGVsZW1lbnQocykuXG4gKiBGb3IgbG9uZ2V2aXR5IGl0IGFwcGxpZXMgZGlmZmVyZW50IG1hdGNoaW5nIGFuZCBvcHRpbWl6YXRpb24gc3RyYXRlZ2llcy5cbiAqL1xuaW1wb3J0IGNzc0VzY2FwZSBmcm9tICdjc3MuZXNjYXBlJztcbmltcG9ydCBhZGFwdCBmcm9tICcuL2FkYXB0J1xuaW1wb3J0IG1hdGNoIGZyb20gJy4vbWF0Y2gnXG5pbXBvcnQgb3B0aW1pemUgZnJvbSAnLi9vcHRpbWl6ZSdcbmltcG9ydCB7IGNoZWNrSWdub3JlLCBjb252ZXJ0Tm9kZUxpc3QsIGVzY2FwZVZhbHVlIH0gZnJvbSAnLi91dGlsaXRpZXMnXG5pbXBvcnQgeyBnZXRDb21tb25BbmNlc3RvciwgZ2V0Q29tbW9uUHJvcGVydGllcyB9IGZyb20gJy4vY29tbW9uJ1xuXG4vKipcbiAqIEdldCBhIHNlbGVjdG9yIGZvciB0aGUgcHJvdmlkZWQgZWxlbWVudFxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fSBlbGVtZW50IC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgIG9wdGlvbnMgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNpbmdsZVNlbGVjdG9yIChlbGVtZW50LCBvcHRpb25zID0ge30pIHtcblxuICBpZiAoZWxlbWVudC5ub2RlVHlwZSA9PT0gMykge1xuICAgIGVsZW1lbnQgPSBlbGVtZW50LnBhcmVudE5vZGVcbiAgfVxuXG4gIGlmIChlbGVtZW50Lm5vZGVUeXBlICE9PSAxKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGlucHV0IC0gb25seSBIVE1MRWxlbWVudHMgb3IgcmVwcmVzZW50YXRpb25zIG9mIHRoZW0gYXJlIHN1cHBvcnRlZCEgKG5vdCBcIiR7dHlwZW9mIGVsZW1lbnR9XCIpYClcbiAgfVxuXG4gIGNvbnN0IGdsb2JhbE1vZGlmaWVkID0gYWRhcHQoZWxlbWVudCwgb3B0aW9ucylcblxuICBjb25zdCBzZWxlY3RvciA9IG1hdGNoKGVsZW1lbnQsIG9wdGlvbnMpXG4gIGNvbnN0IG9wdGltaXplZCA9IG9wdGltaXplKHNlbGVjdG9yLCBlbGVtZW50LCBvcHRpb25zKVxuXG4gIC8vIGRlYnVnXG4gIC8vIGNvbnNvbGUubG9nKGBcbiAgLy8gICBzZWxlY3RvcjogICR7c2VsZWN0b3J9XG4gIC8vICAgb3B0aW1pemVkOiAke29wdGltaXplZH1cbiAgLy8gYClcblxuICBpZiAoZ2xvYmFsTW9kaWZpZWQpIHtcbiAgICBkZWxldGUgZ2xvYmFsLmRvY3VtZW50XG4gIH1cblxuICByZXR1cm4gb3B0aW1pemVkXG59XG5cbi8qKlxuICogR2V0IGEgc2VsZWN0b3IgdG8gbWF0Y2ggbXVsdGlwbGUgZGVzY2VuZGFudHMgZnJvbSBhbiBhbmNlc3RvclxuICpcbiAqIEBwYXJhbSAge0FycmF5LjxIVE1MRWxlbWVudD58Tm9kZUxpc3R9IGVsZW1lbnRzIC0gW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucyAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE11bHRpU2VsZWN0b3IgKGVsZW1lbnRzLCBvcHRpb25zID0ge30pIHtcblxuICBpZiAoIUFycmF5LmlzQXJyYXkoZWxlbWVudHMpKSB7XG4gICAgZWxlbWVudHMgPSBjb252ZXJ0Tm9kZUxpc3QoZWxlbWVudHMpXG4gIH1cblxuICBpZiAoZWxlbWVudHMuc29tZSgoZWxlbWVudCkgPT4gZWxlbWVudC5ub2RlVHlwZSAhPT0gMSkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgaW5wdXQgLSBvbmx5IGFuIEFycmF5IG9mIEhUTUxFbGVtZW50cyBvciByZXByZXNlbnRhdGlvbnMgb2YgdGhlbSBpcyBzdXBwb3J0ZWQhYClcbiAgfVxuXG4gIGNvbnN0IGdsb2JhbE1vZGlmaWVkID0gYWRhcHQoZWxlbWVudHNbMF0sIG9wdGlvbnMpXG5cbiAgY29uc3QgYW5jZXN0b3IgPSBnZXRDb21tb25BbmNlc3RvcihlbGVtZW50cywgb3B0aW9ucylcbiAgY29uc3QgYW5jZXN0b3JTZWxlY3RvciA9IGdldFNpbmdsZVNlbGVjdG9yKGFuY2VzdG9yLCBvcHRpb25zKVxuXG4gIC8vIFRPRE86IGNvbnNpZGVyIHVzYWdlIG9mIG11bHRpcGxlIHNlbGVjdG9ycyArIHBhcmVudC1jaGlsZCByZWxhdGlvbiArIGNoZWNrIGZvciBwYXJ0IHJlZHVuZGFuY3lcbiAgY29uc3QgY29tbW9uU2VsZWN0b3JzID0gZ2V0Q29tbW9uU2VsZWN0b3JzKGVsZW1lbnRzLCBvcHRpb25zKVxuICBjb25zdCBkZXNjZW5kYW50U2VsZWN0b3IgPSBjb21tb25TZWxlY3RvcnNbMF1cblxuICBjb25zdCBzZWxlY3RvciA9IG9wdGltaXplKFthbmNlc3RvclNlbGVjdG9yLCBkZXNjZW5kYW50U2VsZWN0b3JdLCBlbGVtZW50cywgb3B0aW9ucylcbiAgY29uc3Qgc2VsZWN0b3JNYXRjaGVzID0gY29udmVydE5vZGVMaXN0KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKVxuXG4gIGlmICghZWxlbWVudHMuZXZlcnkoKGVsZW1lbnQpID0+IHNlbGVjdG9yTWF0Y2hlcy5zb21lKChlbnRyeSkgPT4gZW50cnkgPT09IGVsZW1lbnQpICkpIHtcbiAgICAvLyBUT0RPOiBjbHVzdGVyIG1hdGNoZXMgdG8gc3BsaXQgaW50byBzaW1pbGFyIGdyb3VwcyBmb3Igc3ViIHNlbGVjdGlvbnNcbiAgICAvKlxuICAgICAgcmV0dXJuIGNvbnNvbGUud2FybihgXG4gICAgICAgIFRoZSBzZWxlY3RlZCBlbGVtZW50cyBjYW5cXCd0IGJlIGVmZmljaWVudGx5IG1hcHBlZC5cbiAgICAgICAgSXRzIHByb2JhYmx5IGJlc3QgdG8gdXNlIG11bHRpcGxlIHNpbmdsZSBzZWxlY3RvcnMgaW5zdGVhZCFcbiAgICAgIGAsIGVsZW1lbnRzKVxuICAgICovXG4gIH1cblxuICBpZiAoZ2xvYmFsTW9kaWZpZWQpIHtcbiAgICBkZWxldGUgZ2xvYmFsLmRvY3VtZW50XG4gIH1cblxuICByZXR1cm4gc2VsZWN0b3Jcbn1cblxuLyoqXG4gKiBHZXQgc2VsZWN0b3JzIHRvIGRlc2NyaWJlIGEgc2V0IG9mIGVsZW1lbnRzXG4gKlxuICogQHBhcmFtICB7QXJyYXkuPEhUTUxFbGVtZW50cz59IGVsZW1lbnRzIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgIC0gW2Rlc2NyaXB0aW9uXVxuICovXG5mdW5jdGlvbiBnZXRDb21tb25TZWxlY3RvcnMgKGVsZW1lbnRzLCBvcHRpb25zKSB7XG4gIGNvbnN0IGlnbm9yZSA9IG9wdGlvbnMuaWdub3JlO1xuICBjb25zdCB7IGNsYXNzZXMsIGF0dHJpYnV0ZXMsIHRhZyB9ID0gZ2V0Q29tbW9uUHJvcGVydGllcyhlbGVtZW50cylcblxuICBjb25zdCBzZWxlY3RvclBhdGggPSBbXVxuXG4gIGlmICh0YWcpIHtcbiAgICBpZiAoIWNoZWNrSWdub3JlKGlnbm9yZS50YWcsIG51bGwsIHRhZykpIHtcbiAgICAgIHNlbGVjdG9yUGF0aC5wdXNoKHRhZylcbiAgICB9XG4gIH1cblxuICBpZiAoY2xhc3Nlcykge1xuICAgIGNvbnN0IGNsYXNzU2VsZWN0b3IgPSBjbGFzc2VzLmZpbHRlcigobmFtZSkgPT4gIWNoZWNrSWdub3JlKGlnbm9yZS5jbGFzcywgJ2NsYXNzJywgbmFtZSkpLm1hcCgobmFtZSkgPT4gYC4ke25hbWV9YCkuam9pbignJylcbiAgICBzZWxlY3RvclBhdGgucHVzaChjbGFzc1NlbGVjdG9yKVxuICB9XG5cbiAgaWYgKGF0dHJpYnV0ZXMpIHtcbiAgICBjb25zdCBhdHRyaWJ1dGVTZWxlY3RvciA9IE9iamVjdC5rZXlzKGF0dHJpYnV0ZXMpLnJlZHVjZSgocGFydHMsIG5hbWUpID0+IHtcbiAgICAgIGlmICghY2hlY2tJZ25vcmUoaWdub3JlLmF0dHJpYnV0ZSwgbmFtZSwgYXR0cmlidXRlc1tuYW1lXSkpIHtcbiAgICAgICAgcGFydHMucHVzaChgWyR7bmFtZX09XCIke2Nzc0VzY2FwZShhdHRyaWJ1dGVzW25hbWVdKX1cIl1gKVxuICAgICAgfVxuICAgICAgcmV0dXJuIHBhcnRzXG4gICAgfSwgW10pLmpvaW4oJycpXG4gICAgc2VsZWN0b3JQYXRoLnB1c2goYXR0cmlidXRlU2VsZWN0b3IpO1xuICB9XG5cbiAgaWYgKHNlbGVjdG9yUGF0aC5sZW5ndGgpIHtcbiAgICAvLyBUT0RPOiBjaGVjayBmb3IgcGFyZW50LWNoaWxkIHJlbGF0aW9uXG4gIH1cblxuICByZXR1cm4gW1xuICAgIHNlbGVjdG9yUGF0aC5qb2luKCcnKVxuICBdXG59XG5cbi8qKlxuICogQ2hvb3NlIGFjdGlvbiBkZXBlbmRpbmcgb24gdGhlIGlucHV0IChtdWx0aXBsZS9zaW5nbGUpXG4gKlxuICogTk9URTogZXh0ZW5kZWQgZGV0ZWN0aW9uIGlzIHVzZWQgZm9yIHNwZWNpYWwgY2FzZXMgbGlrZSB0aGUgPHNlbGVjdD4gZWxlbWVudCB3aXRoIDxvcHRpb25zPlxuICpcbiAqIEBwYXJhbSAge0hUTUxFbGVtZW50fE5vZGVMaXN0fEFycmF5LjxIVE1MRWxlbWVudD59IGlucHV0ICAgLSBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zIC0gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtIFtkZXNjcmlwdGlvbl1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZ2V0UXVlcnlTZWxlY3RvciAoaW5wdXQsIG9wdGlvbnMgPSB7fSkge1xuICBpZiAoaW5wdXQubGVuZ3RoICYmICFpbnB1dC5uYW1lKSB7XG4gICAgcmV0dXJuIGdldE11bHRpU2VsZWN0b3IoaW5wdXQsIG9wdGlvbnMpXG4gIH1cbiAgcmV0dXJuIGdldFNpbmdsZVNlbGVjdG9yKGlucHV0LCBvcHRpb25zKVxufVxuIl19
