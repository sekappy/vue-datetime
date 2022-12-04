/*!
 * vue-datetime v1.0.0-beta.13
 * (c) 2022 Mario Juárez
 * Released under the MIT License.
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('luxon')) :
	typeof define === 'function' && define.amd ? define(['exports', 'luxon'], factory) :
	(factory((global.VueDatetime = global.VueDatetime || {}),global.luxon));
}(this, (function (exports,luxon) { 'use strict';

var FlowManager = function FlowManager (flow, endStatus) {
  if ( flow === void 0 ) flow = [];
  if ( endStatus === void 0 ) endStatus = null;

  this.flow = flow;
  this.endStatus = endStatus;
  this.diversionNext = null;
};

FlowManager.prototype.step = function step (index) {
  return this.flow.length > index ? this.flow[index] : this.endStatus
};

FlowManager.prototype.first = function first () {
  return this.step(0)
};

FlowManager.prototype.next = function next (current) {
  if (this.diversionNext) {
    var next = this.diversionNext;
    this.diversionNext = null;

    return next
  }

  return this.step(this.flow.indexOf(current) + 1)
};

FlowManager.prototype.diversion = function diversion (next) {
  this.diversionNext = next;
};

function capitalize (string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function datetimeFromISO (string) {
  var datetime = luxon.DateTime.fromISO(string).toUTC();

  return datetime.isValid ? datetime : null
}

function monthDays (year, month, weekStart) {
  var monthDate = luxon.DateTime.local(year, month, 1);
  var firstDay = monthDate.weekday - weekStart;

  if (firstDay < 0) {
    firstDay += 7;
  }
  var lastDay = (weekStart - monthDate.weekday - monthDate.daysInMonth) % 7;
  if (lastDay < 0) {
    lastDay += 7;
  }

  return Array.apply(null, Array(monthDate.daysInMonth + firstDay + lastDay))
    .map(function (value, index) { return (index + 1 <= firstDay || index >= firstDay + monthDate.daysInMonth) ? null : (index + 1 - firstDay); }
    )
}

function monthDayIsDisabled (minDate, maxDate, year, month, day) {
  var date = luxon.DateTime.fromObject({ year: year, month: month, day: day, zone: 'UTC' });

  minDate = minDate ? startOfDay(minDate.setZone('UTC', { keepLocalTime: true })) : null;
  maxDate = maxDate ? startOfDay(maxDate.setZone('UTC', { keepLocalTime: true })) : null;

  return (minDate && date < minDate) ||
         (maxDate && date > maxDate)
}

function monthIsDisabled (minDate, maxDate, year, month) {
  return (minDate && minDate > luxon.DateTime.utc(year, month, luxon.DateTime.utc(year, month).daysInMonth)) ||
         (maxDate && maxDate < luxon.DateTime.utc(year, month, 1))
}

function yearIsDisabled (minDate, maxDate, year) {
  var minYear = minDate ? minDate.year : null;
  var maxYear = maxDate ? maxDate.year : null;

  return (minYear && year < minYear) ||
         (maxYear && year > maxYear)
}

function timeComponentIsDisabled (min, max, component) {
  return (min !== null && component < min) ||
         (max !== null && component > max)
}

function weekdays (weekStart) {
  if (--weekStart < 0) {
    weekStart = 6;
  }

  var weekDays = luxon.Info.weekdays('short').map(function (weekday) { return capitalize(weekday); });

  weekDays = weekDays.concat(weekDays.splice(0, weekStart));

  return weekDays
}

function months () {
  return luxon.Info.months().map(function (month) { return capitalize(month); })
}

function hours (step) {
  return Array.apply(null, Array(Math.ceil(24 / step))).map(function (item, index) { return index * step; })
}

function minutes (step) {
  return Array.apply(null, Array(Math.ceil(60 / step))).map(function (item, index) { return index * step; })
}

function years (current) {
  return Array.apply(null, Array(201)).map(function (item, index) { return current - 100 + index; })
}

function pad (number) {
  return number < 10 ? '0' + number : number
}

function startOfDay (datetime) {
  return datetime.startOf('day')
}

function createFlowManager (flow) {
  return new FlowManager(flow, 'end')
}

function createFlowManagerFromType (type) {
  var flow = [];

  switch (type) {
    case 'datetime':
      flow = ['date', 'time'];
      break
    case 'time':
      flow = ['time'];
      break
    default:
      flow = ['date'];
  }

  return new FlowManager(flow, 'end')
}

function weekStart () {
  var weekstart;

  try {
    weekstart = require('weekstart/package.json').version ? require('weekstart') : null;
  } catch (e) {
    weekstart = window.weekstart;
  }

  var firstDay = weekstart ? weekstart.getWeekStartByLocale(luxon.Settings.defaultLocale) : 1;

  return firstDay === 0 ? 7 : firstDay
}

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

var script$2 = {
  props: {
    year: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true
    },
    day: {
      type: Number,
      default: null
    },
    disabled: {
      type: Array
    },
    minDate: {
      type: luxon.DateTime,
      default: null
    },
    maxDate: {
      type: luxon.DateTime,
      default: null
    },
    weekStart: {
      type: Number,
      default: 1
    },
    isJapanese: {
      type: Boolean,
      default: false
    }
  },

  data: function data () {
    return {
      newDate: luxon.DateTime.fromObject({ year: this.year, month: this.month, zone: 'UTC' }),
      weekdays: weekdays(this.weekStart),
      months: months()
    }
  },

  computed: {
    newYear: function newYear () {
      return this.newDate.year
    },
    newMonth: function newMonth () {
      return this.newDate.month
    },
    monthName: function monthName () {
      return this.months[this.newMonth - 1]
    },
    days: function days () {
      var this$1 = this;

      return monthDays(this.newYear, this.newMonth, this.weekStart).map(function (day) { return ({
        number: day,
        selected: day && this$1.year === this$1.newYear && this$1.month === this$1.newMonth && this$1.day === day,
        disabled: !day || monthDayIsDisabled(this$1.minDate, this$1.maxDate, this$1.newYear, this$1.newMonth, day)
      }); })
    }
  },

  methods: {
    selectDay: function selectDay (day) {
      if (day.disabled) {
        return
      }

      this.$emit('change', this.newYear, this.newMonth, day.number);
    },
    previousMonth: function previousMonth () {
      this.newDate = this.newDate.minus({ months: 1 });
    },
    nextMonth: function nextMonth () {
      this.newDate = this.newDate.plus({ months: 1 });
    }
  }
};

function normalizeComponent$1(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    var options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    var hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            var originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            var existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

var isOldIE = typeof navigator !== 'undefined' &&
    /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
    return function (id, style) { return addStyle(id, style); };
}
var HEAD;
var styles = {};
function addStyle(id, css) {
    var group = isOldIE ? css.media || 'default' : id;
    var style = styles[group] || (styles[group] = { ids: new Set(), styles: [] });
    if (!style.ids.has(id)) {
        style.ids.add(id);
        var code = css.source;
        if (css.map) {
            // https://developer.chrome.com/devtools/docs/javascript-debugging
            // this makes source maps inside style tags work properly in Chrome
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            // http://stackoverflow.com/a/26603875
            code +=
                '\n/*# sourceMappingURL=data:application/json;base64,' +
                    btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
                    ' */';
        }
        if (!style.element) {
            style.element = document.createElement('style');
            style.element.type = 'text/css';
            if (css.media)
                { style.element.setAttribute('media', css.media); }
            if (HEAD === undefined) {
                HEAD = document.head || document.getElementsByTagName('head')[0];
            }
            HEAD.appendChild(style.element);
        }
        if ('styleSheet' in style.element) {
            style.styles.push(code);
            style.element.styleSheet.cssText = style.styles
                .filter(Boolean)
                .join('\n');
        }
        else {
            var index = style.ids.size - 1;
            var textNode = document.createTextNode(code);
            var nodes = style.element.childNodes;
            if (nodes[index])
                { style.element.removeChild(nodes[index]); }
            if (nodes.length)
                { style.element.insertBefore(textNode, nodes[index]); }
            else
                { style.element.appendChild(textNode); }
        }
    }
}

/* script */
var __vue_script__$2 = script$2;

/* template */
var __vue_render__$2 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", { staticClass: "vdatetime-calendar" }, [
    _c("div", { staticClass: "vdatetime-calendar__navigation" }, [
      _c(
        "div",
        {
          staticClass: "vdatetime-calendar__navigation--previous",
          on: { click: _vm.previousMonth },
        },
        [
          _c(
            "svg",
            {
              attrs: {
                xmlns: "http://www.w3.org/2000/svg",
                viewBox: "0 0 61.3 102.8",
              },
            },
            [
              _c("path", {
                attrs: {
                  fill: "none",
                  stroke: "#444",
                  "stroke-width": "14",
                  "stroke-miterlimit": "10",
                  d: "M56.3 97.8L9.9 51.4 56.3 5",
                },
              }) ]
          ) ]
      ),
      _vm._v(" "),
      _vm.isJapanese
        ? _c("div", { staticClass: "vdatetime-calendar__current--month" }, [
            _vm._v(_vm._s(_vm.newYear) + "年 " + _vm._s(_vm.monthName) + "月") ])
        : _c("div", { staticClass: "vdatetime-calendar__current--month" }, [
            _vm._v(_vm._s(_vm.monthName) + " " + _vm._s(_vm.newYear)) ]),
      _vm._v(" "),
      _c(
        "div",
        {
          staticClass: "vdatetime-calendar__navigation--next",
          on: { click: _vm.nextMonth },
        },
        [
          _c(
            "svg",
            {
              attrs: {
                xmlns: "http://www.w3.org/2000/svg",
                viewBox: "0 0 61.3 102.8",
              },
            },
            [
              _c("path", {
                attrs: {
                  fill: "none",
                  stroke: "#444",
                  "stroke-width": "14",
                  "stroke-miterlimit": "10",
                  d: "M56.3 97.8L9.9 51.4 56.3 5",
                },
              }) ]
          ) ]
      ) ]),
    _vm._v(" "),
    _c(
      "div",
      { staticClass: "vdatetime-calendar__month" },
      [
        _vm._l(_vm.weekdays, function (weekday) {
          return _c(
            "div",
            { staticClass: "vdatetime-calendar__month__weekday" },
            [_vm._v(_vm._s(weekday))]
          )
        }),
        _vm._v(" "),
        _vm._l(_vm.days, function (day) {
          return _c(
            "div",
            {
              staticClass: "vdatetime-calendar__month__day",
              class: {
                "vdatetime-calendar__month__day--selected": day.selected,
                "vdatetime-calendar__month__day--disabled": day.disabled,
              },
              on: {
                click: function ($event) {
                  return _vm.selectDay(day)
                },
              },
            },
            [_c("span", [_c("span", [_vm._v(_vm._s(day.number))])])]
          )
        }) ],
      2
    ) ])
};
var __vue_staticRenderFns__$2 = [];
__vue_render__$2._withStripped = true;

  /* style */
  var __vue_inject_styles__$2 = function (inject) {
    if (!inject) { return }
    inject("data-v-1e362fc2_0", { source: "\n.vdatetime-calendar__navigation,\n.vdatetime-calendar__navigation * {\n  box-sizing: border-box;\n}\n.vdatetime-calendar__navigation {\n  position: relative;\n  margin: 15px 0;\n  padding: 0 30px;\n  width: 100%;\n}\n.vdatetime-calendar__navigation--previous,\n.vdatetime-calendar__navigation--next {\n  position: absolute;\n  top: 0;\n  padding: 0 5px;\n  width: 18px;\n  cursor: pointer;\n& svg {\n    width: 8px;\n    height: 13px;\n& path {\n      transition: stroke .3s;\n}\n}\n&:hover svg path {\n    stroke: #888;\n}\n}\n.vdatetime-calendar__navigation--previous {\n  left: 25px;\n}\n.vdatetime-calendar__navigation--next {\n  right: 25px;\n  transform: scaleX(-1);\n}\n.vdatetime-calendar__current--month {\n  text-align: center;\n  text-transform: capitalize;\n}\n.vdatetime-calendar__month {\n  padding: 0 20px;\n  transition: height .2s;\n}\n.vdatetime-calendar__month__weekday,\n.vdatetime-calendar__month__day {\n  display: inline-block;\n  width: calc(100% / 7);\n  line-height: 36px;\n  text-align: center;\n  font-size: 15px;\n  font-weight: 300;\n  cursor: pointer;\n& > span {\n    display: block;\n    width: 100%;\n    position: relative;\n    height: 0;\n    padding: 0 0 100%;\n    overflow: hidden;\n& > span {\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      position: absolute;\n      top: 0;\n      right: 0;\n      bottom: 0;\n      left: 0;\n      border: 0;\n      border-radius: 50%;\n      transition: background-color .3s, color .3s;\n}\n}\n}\n.vdatetime-calendar__month__weekday {\n  font-weight: bold;\n}\n.vdatetime-calendar__month__day:hover > span > span {\n  background: #eee;\n}\n.vdatetime-calendar__month__day--selected {\n& > span > span,\n  &:hover > span > span {\n    color: #fff;\n    background: #3f51b5;\n}\n}\n.vdatetime-calendar__month__day--disabled {\n  opacity: 0.4;\n  cursor: default;\n&:hover > span > span {\n    color: inherit;\n    background: transparent;\n}\n}\n", map: {"version":3,"sources":["/home/ec2-user/vue-datetime/src/DatetimeCalendar.vue"],"names":[],"mappings":";AA8GA;;EAEA,sBAAA;AACA;AAEA;EACA,kBAAA;EACA,cAAA;EACA,eAAA;EACA,WAAA;AACA;AAEA;;EAEA,kBAAA;EACA,MAAA;EACA,cAAA;EACA,WAAA;EACA,eAAA;AAEA;IACA,UAAA;IACA,YAAA;AAEA;MACA,sBAAA;AACA;AACA;AAEA;IACA,YAAA;AACA;AACA;AAEA;EACA,UAAA;AACA;AAEA;EACA,WAAA;EACA,qBAAA;AACA;AAEA;EACA,kBAAA;EACA,0BAAA;AACA;AAEA;EACA,eAAA;EACA,sBAAA;AACA;AAEA;;EAEA,qBAAA;EACA,qBAAA;EACA,iBAAA;EACA,kBAAA;EACA,eAAA;EACA,gBAAA;EACA,eAAA;AAEA;IACA,cAAA;IACA,WAAA;IACA,kBAAA;IACA,SAAA;IACA,iBAAA;IACA,gBAAA;AAEA;MACA,aAAA;MACA,uBAAA;MACA,mBAAA;MACA,kBAAA;MACA,MAAA;MACA,QAAA;MACA,SAAA;MACA,OAAA;MACA,SAAA;MACA,kBAAA;MACA,2CAAA;AACA;AACA;AACA;AAEA;EACA,iBAAA;AACA;AAEA;EACA,gBAAA;AACA;AAEA;AACA;;IAEA,WAAA;IACA,mBAAA;AACA;AACA;AAEA;EACA,YAAA;EACA,eAAA;AAEA;IACA,cAAA;IACA,uBAAA;AACA;AACA","file":"DatetimeCalendar.vue","sourcesContent":["<template>\n  <div class=\"vdatetime-calendar\">\n    <div class=\"vdatetime-calendar__navigation\">\n      <div class=\"vdatetime-calendar__navigation--previous\" @click=\"previousMonth\">\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 61.3 102.8\">\n          <path fill=\"none\" stroke=\"#444\" stroke-width=\"14\" stroke-miterlimit=\"10\" d=\"M56.3 97.8L9.9 51.4 56.3 5\"/>\n        </svg>\n      </div>\n      <div class=\"vdatetime-calendar__current--month\" v-if=\"isJapanese\">{{ newYear }}年 {{ monthName }}月</div>\n      <div class=\"vdatetime-calendar__current--month\" v-else>{{ monthName }} {{ newYear }}</div>\n      <div class=\"vdatetime-calendar__navigation--next\" @click=\"nextMonth\">\n        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 61.3 102.8\">\n          <path fill=\"none\" stroke=\"#444\" stroke-width=\"14\" stroke-miterlimit=\"10\" d=\"M56.3 97.8L9.9 51.4 56.3 5\"/>\n        </svg>\n      </div>\n    </div>\n    <div class=\"vdatetime-calendar__month\">\n      <div class=\"vdatetime-calendar__month__weekday\" v-for=\"weekday in weekdays\">{{ weekday }}</div>\n      <div class=\"vdatetime-calendar__month__day\" v-for=\"day in days\" @click=\"selectDay(day)\" :class=\"{'vdatetime-calendar__month__day--selected': day.selected, 'vdatetime-calendar__month__day--disabled': day.disabled}\">\n        <span><span>{{ day.number }}</span></span>\n      </div>\n    </div>\n  </div>\n</template>\n\n<script>\nimport { DateTime } from 'luxon'\nimport { monthDayIsDisabled, monthDays, months, weekdays } from './util'\n\nexport default {\n  props: {\n    year: {\n      type: Number,\n      required: true\n    },\n    month: {\n      type: Number,\n      required: true\n    },\n    day: {\n      type: Number,\n      default: null\n    },\n    disabled: {\n      type: Array\n    },\n    minDate: {\n      type: DateTime,\n      default: null\n    },\n    maxDate: {\n      type: DateTime,\n      default: null\n    },\n    weekStart: {\n      type: Number,\n      default: 1\n    },\n    isJapanese: {\n      type: Boolean,\n      default: false\n    }\n  },\n\n  data () {\n    return {\n      newDate: DateTime.fromObject({ year: this.year, month: this.month, zone: 'UTC' }),\n      weekdays: weekdays(this.weekStart),\n      months: months()\n    }\n  },\n\n  computed: {\n    newYear () {\n      return this.newDate.year\n    },\n    newMonth () {\n      return this.newDate.month\n    },\n    monthName () {\n      return this.months[this.newMonth - 1]\n    },\n    days () {\n      return monthDays(this.newYear, this.newMonth, this.weekStart).map(day => ({\n        number: day,\n        selected: day && this.year === this.newYear && this.month === this.newMonth && this.day === day,\n        disabled: !day || monthDayIsDisabled(this.minDate, this.maxDate, this.newYear, this.newMonth, day)\n      }))\n    }\n  },\n\n  methods: {\n    selectDay (day) {\n      if (day.disabled) {\n        return\n      }\n\n      this.$emit('change', this.newYear, this.newMonth, day.number)\n    },\n    previousMonth () {\n      this.newDate = this.newDate.minus({ months: 1 })\n    },\n    nextMonth () {\n      this.newDate = this.newDate.plus({ months: 1 })\n    }\n  }\n}\n</script>\n\n<style>\n.vdatetime-calendar__navigation,\n.vdatetime-calendar__navigation * {\n  box-sizing: border-box;\n}\n\n.vdatetime-calendar__navigation {\n  position: relative;\n  margin: 15px 0;\n  padding: 0 30px;\n  width: 100%;\n}\n\n.vdatetime-calendar__navigation--previous,\n.vdatetime-calendar__navigation--next {\n  position: absolute;\n  top: 0;\n  padding: 0 5px;\n  width: 18px;\n  cursor: pointer;\n\n  & svg {\n    width: 8px;\n    height: 13px;\n\n    & path {\n      transition: stroke .3s;\n    }\n  }\n\n  &:hover svg path {\n    stroke: #888;\n  }\n}\n\n.vdatetime-calendar__navigation--previous {\n  left: 25px;\n}\n\n.vdatetime-calendar__navigation--next {\n  right: 25px;\n  transform: scaleX(-1);\n}\n\n.vdatetime-calendar__current--month {\n  text-align: center;\n  text-transform: capitalize;\n}\n\n.vdatetime-calendar__month {\n  padding: 0 20px;\n  transition: height .2s;\n}\n\n.vdatetime-calendar__month__weekday,\n.vdatetime-calendar__month__day {\n  display: inline-block;\n  width: calc(100% / 7);\n  line-height: 36px;\n  text-align: center;\n  font-size: 15px;\n  font-weight: 300;\n  cursor: pointer;\n\n  & > span {\n    display: block;\n    width: 100%;\n    position: relative;\n    height: 0;\n    padding: 0 0 100%;\n    overflow: hidden;\n\n    & > span {\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      position: absolute;\n      top: 0;\n      right: 0;\n      bottom: 0;\n      left: 0;\n      border: 0;\n      border-radius: 50%;\n      transition: background-color .3s, color .3s;\n    }\n  }\n}\n\n.vdatetime-calendar__month__weekday {\n  font-weight: bold;\n}\n\n.vdatetime-calendar__month__day:hover > span > span {\n  background: #eee;\n}\n\n.vdatetime-calendar__month__day--selected {\n  & > span > span,\n  &:hover > span > span {\n    color: #fff;\n    background: #3f51b5;\n  }\n}\n\n.vdatetime-calendar__month__day--disabled {\n  opacity: 0.4;\n  cursor: default;\n\n  &:hover > span > span {\n    color: inherit;\n    background: transparent;\n  }\n}\n</style>\n"]}, media: undefined });

  };
  /* scoped */
  var __vue_scope_id__$2 = undefined;
  /* module identifier */
  var __vue_module_identifier__$2 = undefined;
  /* functional template */
  var __vue_is_functional_template__$2 = false;
  /* component normalizer */
  /* style inject */
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  var __vue_component__$2 = /*#__PURE__*/normalizeComponent$1(
    { render: __vue_render__$2, staticRenderFns: __vue_staticRenderFns__$2 },
    __vue_inject_styles__$2,
    __vue_script__$2,
    __vue_scope_id__$2,
    __vue_is_functional_template__$2,
    __vue_module_identifier__$2,
    false,
    createInjector,
    undefined,
    undefined
  );

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

var script$3 = {
  props: {
    hour: {
      type: Number,
      required: true
    },
    minute: {
      type: Number,
      required: true
    },
    use12Hour: {
      type: Boolean,
      default: false
    },
    hourStep: {
      type: Number,
      default: 1
    },
    minuteStep: {
      type: Number,
      default: 1
    },
    minTime: {
      type: String,
      default: null
    },
    maxTime: {
      type: String,
      default: null
    }
  },

  computed: {
    hours: function hours$1 () {
      var this$1 = this;

      return hours(this.hourStep).filter(function (hour) {
        if (!this$1.use12Hour) {
          return true
        } else {
          if (this$1.hour < 12) {
            return hour < 12
          } else {
            return hour >= 12
          }
        }
      }).map(function (hour) { return ({
        number: pad(hour),
        selected: hour === this$1.hour,
        disabled: timeComponentIsDisabled(this$1.minHour, this$1.maxHour, hour)
      }); })
    },
    minutes: function minutes$1 () {
      var this$1 = this;

      return minutes(this.minuteStep).map(function (minute) { return ({
        number: pad(minute),
        selected: minute === this$1.minute,
        disabled: timeComponentIsDisabled(this$1.minMinute, this$1.maxMinute, minute)
      }); })
    },
    minHour: function minHour () {
      return this.minTime ? parseInt(this.minTime.split(':')[0]) : null
    },
    minMinute: function minMinute () {
      return this.minTime && this.minHour === this.hour ? parseInt(this.minTime.split(':')[1]) : null
    },
    maxHour: function maxHour () {
      return this.maxTime ? parseInt(this.maxTime.split(':')[0]) : null
    },
    maxMinute: function maxMinute () {
      return this.maxTime && this.maxHour === this.hour ? parseInt(this.maxTime.split(':')[1]) : null
    }
  },

  methods: {
    selectHour: function selectHour (hour) {
      if (hour.disabled) {
        return
      }

      this.$emit('change', { hour: parseInt(hour.number) });
    },
    selectMinute: function selectMinute (minute) {
      if (minute.disabled) {
        return
      }

      this.$emit('change', { minute: parseInt(minute.number) });
    },
    selectSuffix: function selectSuffix (suffix) {
      if (suffix === 'am') {
        if (this.hour >= 12) {
          this.$emit('change', { hour: parseInt(this.hour - 12), suffixTouched: true });
        }
      }
      if (suffix === 'pm') {
        if (this.hour < 12) {
          this.$emit('change', { hour: parseInt(this.hour + 12), suffixTouched: true });
        }
      }
    },
    formatHour: function formatHour (hour) {
      var numHour = Number(hour);
      if (this.use12Hour) {
        if (numHour === 0) {
          return 12
        }
        if (numHour > 12) {
          return numHour - 12
        }
        return numHour
      }
      return hour
    }
  },

  mounted: function mounted () {
    var selectedHour = this.$refs.hourList.querySelector('.vdatetime-time-picker__item--selected');
    var selectedMinute = this.$refs.minuteList.querySelector('.vdatetime-time-picker__item--selected');
    this.$refs.hourList.scrollTop = selectedHour ? selectedHour.offsetTop - 250 : 0;
    this.$refs.minuteList.scrollTop = selectedMinute ? selectedMinute.offsetTop - 250 : 0;
  }
};

/* script */
var __vue_script__$3 = script$3;

/* template */
var __vue_render__$3 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    {
      class: {
        "vdatetime-time-picker": true,
        "vdatetime-time-picker__with-suffix": _vm.use12Hour,
      },
    },
    [
      _c(
        "div",
        {
          ref: "hourList",
          staticClass:
            "vdatetime-time-picker__list vdatetime-time-picker__list--hours",
        },
        _vm._l(_vm.hours, function (hour) {
          return _c(
            "div",
            {
              staticClass: "vdatetime-time-picker__item",
              class: {
                "vdatetime-time-picker__item--selected": hour.selected,
                "vdatetime-time-picker__item--disabled": hour.disabled,
              },
              on: {
                click: function ($event) {
                  return _vm.selectHour(hour)
                },
              },
            },
            [_vm._v(_vm._s(_vm.formatHour(hour.number)))]
          )
        }),
        0
      ),
      _vm._v(" "),
      _c(
        "div",
        {
          ref: "minuteList",
          staticClass:
            "vdatetime-time-picker__list vdatetime-time-picker__list--minutes",
        },
        _vm._l(_vm.minutes, function (minute) {
          return _c(
            "div",
            {
              staticClass: "vdatetime-time-picker__item",
              class: {
                "vdatetime-time-picker__item--selected": minute.selected,
                "vdatetime-time-picker__item--disabled": minute.disabled,
              },
              on: {
                click: function ($event) {
                  return _vm.selectMinute(minute)
                },
              },
            },
            [_vm._v(_vm._s(minute.number))]
          )
        }),
        0
      ),
      _vm._v(" "),
      _vm.use12Hour
        ? _c(
            "div",
            {
              ref: "suffixList",
              staticClass:
                "vdatetime-time-picker__list vdatetime-time-picker__list--suffix",
            },
            [
              _c(
                "div",
                {
                  staticClass: "vdatetime-time-picker__item",
                  class: {
                    "vdatetime-time-picker__item--selected": _vm.hour < 12,
                  },
                  on: {
                    click: function ($event) {
                      return _vm.selectSuffix("am")
                    },
                  },
                },
                [_vm._v("am")]
              ),
              _vm._v(" "),
              _c(
                "div",
                {
                  staticClass: "vdatetime-time-picker__item",
                  class: {
                    "vdatetime-time-picker__item--selected": _vm.hour >= 12,
                  },
                  on: {
                    click: function ($event) {
                      return _vm.selectSuffix("pm")
                    },
                  },
                },
                [_vm._v("pm")]
              ) ]
          )
        : _vm._e() ]
  )
};
var __vue_staticRenderFns__$3 = [];
__vue_render__$3._withStripped = true;

  /* style */
  var __vue_inject_styles__$3 = function (inject) {
    if (!inject) { return }
    inject("data-v-c36d86da_0", { source: "\n.vdatetime-time-picker {\n  box-sizing: border-box;\n&::after {\n    content: '';\n    display: table;\n    clear: both;\n}\n& * {\n    box-sizing: border-box;\n}\n}\n.vdatetime-time-picker__list {\n  float: left;\n  width: 50%;\n  height: 305px;\n  overflow-y: scroll;\n  -webkit-overflow-scrolling: touch;\n&::-webkit-scrollbar {\n    width: 3px;\n}\n&::-webkit-scrollbar-track {\n    background: #efefef;\n}\n&::-webkit-scrollbar-thumb {\n    background: #ccc;\n}\n}\n.vdatetime-time-picker__with-suffix .vdatetime-time-picker__list {\n  width: 33.3%;\n}\n.vdatetime-time-picker__item {\n  padding: 10px 0;\n  font-size: 20px;\n  text-align: center;\n  cursor: pointer;\n  transition: font-size .3s;\n}\n.vdatetime-time-picker__item:hover {\n  font-size: 32px;\n}\n.vdatetime-time-picker__item--selected {\n  color: #3f51b5;\n  font-size: 32px;\n}\n.vdatetime-time-picker__item--disabled {\n  opacity: 0.4;\n  cursor: default;\n  font-size: 20px !important;\n}\n", map: {"version":3,"sources":["/home/ec2-user/vue-datetime/src/DatetimeTimePicker.vue"],"names":[],"mappings":";AA6IA;EACA,sBAAA;AAEA;IACA,WAAA;IACA,cAAA;IACA,WAAA;AACA;AAEA;IACA,sBAAA;AACA;AACA;AAEA;EACA,WAAA;EACA,UAAA;EACA,aAAA;EACA,kBAAA;EACA,iCAAA;AAEA;IACA,UAAA;AACA;AAEA;IACA,mBAAA;AACA;AAEA;IACA,gBAAA;AACA;AACA;AAEA;EACA,YAAA;AACA;AAEA;EACA,eAAA;EACA,eAAA;EACA,kBAAA;EACA,eAAA;EACA,yBAAA;AACA;AAEA;EACA,eAAA;AACA;AAEA;EACA,cAAA;EACA,eAAA;AACA;AAEA;EACA,YAAA;EACA,eAAA;EACA,0BAAA;AACA","file":"DatetimeTimePicker.vue","sourcesContent":["<template>\n  <div :class=\"{'vdatetime-time-picker': true, 'vdatetime-time-picker__with-suffix': use12Hour}\">\n    <div class=\"vdatetime-time-picker__list vdatetime-time-picker__list--hours\" ref=\"hourList\">\n      <div class=\"vdatetime-time-picker__item\" v-for=\"hour in hours\" @click=\"selectHour(hour)\" :class=\"{'vdatetime-time-picker__item--selected': hour.selected, 'vdatetime-time-picker__item--disabled': hour.disabled}\">{{ formatHour(hour.number) }}</div>\n    </div>\n    <div class=\"vdatetime-time-picker__list vdatetime-time-picker__list--minutes\" ref=\"minuteList\">\n      <div class=\"vdatetime-time-picker__item\" v-for=\"minute in minutes\" @click=\"selectMinute(minute)\" :class=\"{'vdatetime-time-picker__item--selected': minute.selected, 'vdatetime-time-picker__item--disabled': minute.disabled}\">{{ minute.number }}</div>\n    </div>\n    <div class=\"vdatetime-time-picker__list vdatetime-time-picker__list--suffix\" ref=\"suffixList\" v-if=\"use12Hour\">\n      <div class=\"vdatetime-time-picker__item\" @click=\"selectSuffix('am')\" :class=\"{'vdatetime-time-picker__item--selected': hour < 12}\">am</div>\n      <div class=\"vdatetime-time-picker__item\" @click=\"selectSuffix('pm')\" :class=\"{'vdatetime-time-picker__item--selected': hour >= 12}\">pm</div>\n    </div>\n  </div>\n</template>\n\n<script>\nimport { hours, minutes, pad, timeComponentIsDisabled } from './util'\n\nexport default {\n  props: {\n    hour: {\n      type: Number,\n      required: true\n    },\n    minute: {\n      type: Number,\n      required: true\n    },\n    use12Hour: {\n      type: Boolean,\n      default: false\n    },\n    hourStep: {\n      type: Number,\n      default: 1\n    },\n    minuteStep: {\n      type: Number,\n      default: 1\n    },\n    minTime: {\n      type: String,\n      default: null\n    },\n    maxTime: {\n      type: String,\n      default: null\n    }\n  },\n\n  computed: {\n    hours () {\n      return hours(this.hourStep).filter(hour => {\n        if (!this.use12Hour) {\n          return true\n        } else {\n          if (this.hour < 12) {\n            return hour < 12\n          } else {\n            return hour >= 12\n          }\n        }\n      }).map(hour => ({\n        number: pad(hour),\n        selected: hour === this.hour,\n        disabled: timeComponentIsDisabled(this.minHour, this.maxHour, hour)\n      }))\n    },\n    minutes () {\n      return minutes(this.minuteStep).map(minute => ({\n        number: pad(minute),\n        selected: minute === this.minute,\n        disabled: timeComponentIsDisabled(this.minMinute, this.maxMinute, minute)\n      }))\n    },\n    minHour () {\n      return this.minTime ? parseInt(this.minTime.split(':')[0]) : null\n    },\n    minMinute () {\n      return this.minTime && this.minHour === this.hour ? parseInt(this.minTime.split(':')[1]) : null\n    },\n    maxHour () {\n      return this.maxTime ? parseInt(this.maxTime.split(':')[0]) : null\n    },\n    maxMinute () {\n      return this.maxTime && this.maxHour === this.hour ? parseInt(this.maxTime.split(':')[1]) : null\n    }\n  },\n\n  methods: {\n    selectHour (hour) {\n      if (hour.disabled) {\n        return\n      }\n\n      this.$emit('change', { hour: parseInt(hour.number) })\n    },\n    selectMinute (minute) {\n      if (minute.disabled) {\n        return\n      }\n\n      this.$emit('change', { minute: parseInt(minute.number) })\n    },\n    selectSuffix (suffix) {\n      if (suffix === 'am') {\n        if (this.hour >= 12) {\n          this.$emit('change', { hour: parseInt(this.hour - 12), suffixTouched: true })\n        }\n      }\n      if (suffix === 'pm') {\n        if (this.hour < 12) {\n          this.$emit('change', { hour: parseInt(this.hour + 12), suffixTouched: true })\n        }\n      }\n    },\n    formatHour (hour) {\n      const numHour = Number(hour)\n      if (this.use12Hour) {\n        if (numHour === 0) {\n          return 12\n        }\n        if (numHour > 12) {\n          return numHour - 12\n        }\n        return numHour\n      }\n      return hour\n    }\n  },\n\n  mounted () {\n    const selectedHour = this.$refs.hourList.querySelector('.vdatetime-time-picker__item--selected')\n    const selectedMinute = this.$refs.minuteList.querySelector('.vdatetime-time-picker__item--selected')\n    this.$refs.hourList.scrollTop = selectedHour ? selectedHour.offsetTop - 250 : 0\n    this.$refs.minuteList.scrollTop = selectedMinute ? selectedMinute.offsetTop - 250 : 0\n  }\n}\n</script>\n\n<style>\n.vdatetime-time-picker {\n  box-sizing: border-box;\n\n  &::after {\n    content: '';\n    display: table;\n    clear: both;\n  }\n\n  & * {\n    box-sizing: border-box;\n  }\n}\n\n.vdatetime-time-picker__list {\n  float: left;\n  width: 50%;\n  height: 305px;\n  overflow-y: scroll;\n  -webkit-overflow-scrolling: touch;\n\n  &::-webkit-scrollbar {\n    width: 3px;\n  }\n\n  &::-webkit-scrollbar-track {\n    background: #efefef;\n  }\n\n  &::-webkit-scrollbar-thumb {\n    background: #ccc;\n  }\n}\n\n.vdatetime-time-picker__with-suffix .vdatetime-time-picker__list {\n  width: 33.3%;\n}\n\n.vdatetime-time-picker__item {\n  padding: 10px 0;\n  font-size: 20px;\n  text-align: center;\n  cursor: pointer;\n  transition: font-size .3s;\n}\n\n.vdatetime-time-picker__item:hover {\n  font-size: 32px;\n}\n\n.vdatetime-time-picker__item--selected {\n  color: #3f51b5;\n  font-size: 32px;\n}\n\n.vdatetime-time-picker__item--disabled {\n  opacity: 0.4;\n  cursor: default;\n  font-size: 20px !important;\n}\n</style>\n"]}, media: undefined });

  };
  /* scoped */
  var __vue_scope_id__$3 = undefined;
  /* module identifier */
  var __vue_module_identifier__$3 = undefined;
  /* functional template */
  var __vue_is_functional_template__$3 = false;
  /* component normalizer */
  /* style inject */
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  var __vue_component__$3 = /*#__PURE__*/normalizeComponent$1(
    { render: __vue_render__$3, staticRenderFns: __vue_staticRenderFns__$3 },
    __vue_inject_styles__$3,
    __vue_script__$3,
    __vue_scope_id__$3,
    __vue_is_functional_template__$3,
    __vue_module_identifier__$3,
    false,
    createInjector,
    undefined,
    undefined
  );

//
//
//
//
//
//
//
//
//

var script$4 = {
  props: {
    year: {
      type: Number,
      required: true
    },
    minDate: {
      type: luxon.DateTime,
      default: null
    },
    maxDate: {
      type: luxon.DateTime,
      default: null
    }
  },

  computed: {
    years: function years$1 () {
      var this$1 = this;

      return years(this.year).map(function (year) { return ({
        number: year,
        selected: year === this$1.year,
        disabled: !year || yearIsDisabled(this$1.minDate, this$1.maxDate, year)
      }); })
    }
  },

  methods: {
    select: function select (year) {
      if (year.disabled) {
        return
      }

      this.$emit('change', parseInt(year.number));
    },

    scrollToCurrent: function scrollToCurrent () {
      if (this.$refs.yearList) {
        var selectedYear = this.$refs.yearList.querySelector('.vdatetime-year-picker__item--selected');
        this.$refs.yearList.scrollTop = selectedYear ? selectedYear.offsetTop - 250 : 0;
      }
    }
  },

  mounted: function mounted () {
    this.scrollToCurrent();
  },

  updated: function updated () {
    this.scrollToCurrent();
  }
};

/* script */
var __vue_script__$4 = script$4;

/* template */
var __vue_render__$4 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", { staticClass: "vdatetime-year-picker" }, [
    _c(
      "div",
      {
        ref: "yearList",
        staticClass: "vdatetime-year-picker__list vdatetime-year-picker__list",
      },
      _vm._l(_vm.years, function (year) {
        return _c(
          "div",
          {
            staticClass: "vdatetime-year-picker__item",
            class: {
              "vdatetime-year-picker__item--selected": year.selected,
              "vdatetime-year-picker__item--disabled": year.disabled,
            },
            on: {
              click: function ($event) {
                return _vm.select(year)
              },
            },
          },
          [_vm._v(_vm._s(year.number) + "\n    ")]
        )
      }),
      0
    ) ])
};
var __vue_staticRenderFns__$4 = [];
__vue_render__$4._withStripped = true;

  /* style */
  var __vue_inject_styles__$4 = function (inject) {
    if (!inject) { return }
    inject("data-v-46e544b6_0", { source: "\n.vdatetime-year-picker {\n  box-sizing: border-box;\n&::after {\n    content: '';\n    display: table;\n    clear: both;\n}\n& * {\n    box-sizing: border-box;\n}\n}\n.vdatetime-year-picker__list {\n  float: left;\n  width: 100%;\n  height: 305px;\n  overflow-y: scroll;\n  -webkit-overflow-scrolling: touch;\n&::-webkit-scrollbar {\n    width: 3px;\n}\n&::-webkit-scrollbar-track {\n    background: #efefef;\n}\n&::-webkit-scrollbar-thumb {\n    background: #ccc;\n}\n}\n.vdatetime-year-picker__item {\n  padding: 10px 0;\n  font-size: 20px;\n  text-align: center;\n  cursor: pointer;\n  transition: font-size .3s;\n}\n.vdatetime-year-picker__item:hover {\n  font-size: 32px;\n}\n.vdatetime-year-picker__item--selected {\n  color: #3f51b5;\n  font-size: 32px;\n}\n.vdatetime-year-picker__item--disabled {\n  opacity: 0.4;\n  cursor: default;\n&:hover {\n    color: inherit;\n    background: transparent;\n}\n}\n", map: {"version":3,"sources":["/home/ec2-user/vue-datetime/src/DatetimeYearPicker.vue"],"names":[],"mappings":";AAmEA;EACA,sBAAA;AAEA;IACA,WAAA;IACA,cAAA;IACA,WAAA;AACA;AAEA;IACA,sBAAA;AACA;AACA;AAEA;EACA,WAAA;EACA,WAAA;EACA,aAAA;EACA,kBAAA;EACA,iCAAA;AAEA;IACA,UAAA;AACA;AAEA;IACA,mBAAA;AACA;AAEA;IACA,gBAAA;AACA;AACA;AAEA;EACA,eAAA;EACA,eAAA;EACA,kBAAA;EACA,eAAA;EACA,yBAAA;AACA;AAEA;EACA,eAAA;AACA;AAEA;EACA,cAAA;EACA,eAAA;AACA;AAEA;EACA,YAAA;EACA,eAAA;AAEA;IACA,cAAA;IACA,uBAAA;AACA;AACA","file":"DatetimeYearPicker.vue","sourcesContent":["<template>\n  <div class=\"vdatetime-year-picker\">\n    <div class=\"vdatetime-year-picker__list vdatetime-year-picker__list\" ref=\"yearList\">\n      <div class=\"vdatetime-year-picker__item\" v-for=\"year in years\" @click=\"select(year)\" :class=\"{'vdatetime-year-picker__item--selected': year.selected, 'vdatetime-year-picker__item--disabled': year.disabled}\">{{ year.number }}\n      </div>\n    </div>\n  </div>\n</template>\n\n<script>\nimport { DateTime } from 'luxon'\nimport { yearIsDisabled, years } from './util'\n\nexport default {\n  props: {\n    year: {\n      type: Number,\n      required: true\n    },\n    minDate: {\n      type: DateTime,\n      default: null\n    },\n    maxDate: {\n      type: DateTime,\n      default: null\n    }\n  },\n\n  computed: {\n    years () {\n      return years(this.year).map(year => ({\n        number: year,\n        selected: year === this.year,\n        disabled: !year || yearIsDisabled(this.minDate, this.maxDate, year)\n      }))\n    }\n  },\n\n  methods: {\n    select (year) {\n      if (year.disabled) {\n        return\n      }\n\n      this.$emit('change', parseInt(year.number))\n    },\n\n    scrollToCurrent () {\n      if (this.$refs.yearList) {\n        const selectedYear = this.$refs.yearList.querySelector('.vdatetime-year-picker__item--selected')\n        this.$refs.yearList.scrollTop = selectedYear ? selectedYear.offsetTop - 250 : 0\n      }\n    }\n  },\n\n  mounted () {\n    this.scrollToCurrent()\n  },\n\n  updated () {\n    this.scrollToCurrent()\n  }\n}\n</script>\n\n<style>\n.vdatetime-year-picker {\n  box-sizing: border-box;\n\n  &::after {\n    content: '';\n    display: table;\n    clear: both;\n  }\n\n  & * {\n    box-sizing: border-box;\n  }\n}\n\n.vdatetime-year-picker__list {\n  float: left;\n  width: 100%;\n  height: 305px;\n  overflow-y: scroll;\n  -webkit-overflow-scrolling: touch;\n\n  &::-webkit-scrollbar {\n    width: 3px;\n  }\n\n  &::-webkit-scrollbar-track {\n    background: #efefef;\n  }\n\n  &::-webkit-scrollbar-thumb {\n    background: #ccc;\n  }\n}\n\n.vdatetime-year-picker__item {\n  padding: 10px 0;\n  font-size: 20px;\n  text-align: center;\n  cursor: pointer;\n  transition: font-size .3s;\n}\n\n.vdatetime-year-picker__item:hover {\n  font-size: 32px;\n}\n\n.vdatetime-year-picker__item--selected {\n  color: #3f51b5;\n  font-size: 32px;\n}\n\n.vdatetime-year-picker__item--disabled {\n  opacity: 0.4;\n  cursor: default;\n\n  &:hover {\n    color: inherit;\n    background: transparent;\n  }\n}\n</style>\n"]}, media: undefined });

  };
  /* scoped */
  var __vue_scope_id__$4 = undefined;
  /* module identifier */
  var __vue_module_identifier__$4 = undefined;
  /* functional template */
  var __vue_is_functional_template__$4 = false;
  /* component normalizer */
  /* style inject */
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  var __vue_component__$4 = /*#__PURE__*/normalizeComponent$1(
    { render: __vue_render__$4, staticRenderFns: __vue_staticRenderFns__$4 },
    __vue_inject_styles__$4,
    __vue_script__$4,
    __vue_scope_id__$4,
    __vue_is_functional_template__$4,
    __vue_module_identifier__$4,
    false,
    createInjector,
    undefined,
    undefined
  );

//
//
//
//
//
//
//
//
//

var script$5 = {
  props: {
    year: {
      type: Number,
      required: true
    },
    month: {
      type: Number,
      required: true
    },
    minDate: {
      type: luxon.DateTime,
      default: null
    },
    maxDate: {
      type: luxon.DateTime,
      default: null
    }
  },

  computed: {
    months: function months$1 () {
      var this$1 = this;

      return months(this.month).map(function (month, index) { return ({
        number: ++index,
        label: month,
        selected: index === this$1.month,
        disabled: !index || monthIsDisabled(this$1.minDate, this$1.maxDate, this$1.year, index)
      }); })
    }
  },

  methods: {
    select: function select (month) {
      if (month.disabled) {
        return
      }

      this.$emit('change', parseInt(month.number));
    },

    scrollToCurrent: function scrollToCurrent () {
      var selectedMonth = this.$refs.monthList.querySelector('.vdatetime-month-picker__item--selected');
      this.$refs.monthList.scrollTop = selectedMonth ? selectedMonth.offsetTop - 250 : 0;
    }
  },

  mounted: function mounted () {
    this.scrollToCurrent();
  },

  updated: function updated () {
    this.scrollToCurrent();
  }
};

/* script */
var __vue_script__$5 = script$5;

/* template */
var __vue_render__$5 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", { staticClass: "vdatetime-month-picker" }, [
    _c(
      "div",
      {
        ref: "monthList",
        staticClass:
          "vdatetime-month-picker__list vdatetime-month-picker__list",
      },
      _vm._l(_vm.months, function (month) {
        return _c(
          "div",
          {
            staticClass: "vdatetime-month-picker__item",
            class: {
              "vdatetime-month-picker__item--selected": month.selected,
              "vdatetime-month-picker__item--disabled": month.disabled,
            },
            on: {
              click: function ($event) {
                return _vm.select(month)
              },
            },
          },
          [_vm._v(_vm._s(month.label) + "\n    ")]
        )
      }),
      0
    ) ])
};
var __vue_staticRenderFns__$5 = [];
__vue_render__$5._withStripped = true;

  /* style */
  var __vue_inject_styles__$5 = function (inject) {
    if (!inject) { return }
    inject("data-v-c2503e04_0", { source: "\n.vdatetime-month-picker {\n  box-sizing: border-box;\n&::after {\n    content: '';\n    display: table;\n    clear: both;\n}\n& * {\n    box-sizing: border-box;\n}\n}\n.vdatetime-month-picker__list {\n  float: left;\n  width: 100%;\n  height: 305px;\n  overflow-y: scroll;\n  -webkit-overflow-scrolling: touch;\n&::-webkit-scrollbar {\n    width: 3px;\n}\n&::-webkit-scrollbar-track {\n    background: #efefef;\n}\n&::-webkit-scrollbar-thumb {\n    background: #ccc;\n}\n}\n.vdatetime-month-picker__item {\n  padding: 10px 0;\n  font-size: 20px;\n  text-align: center;\n  cursor: pointer;\n  transition: font-size .3s;\n}\n.vdatetime-month-picker__item:hover {\n  font-size: 32px;\n}\n.vdatetime-month-picker__item--selected {\n  color: #3f51b5;\n  font-size: 32px;\n}\n.vdatetime-month-picker__item--disabled {\n  opacity: 0.4;\n  cursor: default;\n&:hover {\n    color: inherit;\n    background: transparent;\n}\n}\n", map: {"version":3,"sources":["/home/ec2-user/vue-datetime/src/DatetimeMonthPicker.vue"],"names":[],"mappings":";AAsEA;EACA,sBAAA;AAEA;IACA,WAAA;IACA,cAAA;IACA,WAAA;AACA;AAEA;IACA,sBAAA;AACA;AACA;AAEA;EACA,WAAA;EACA,WAAA;EACA,aAAA;EACA,kBAAA;EACA,iCAAA;AAEA;IACA,UAAA;AACA;AAEA;IACA,mBAAA;AACA;AAEA;IACA,gBAAA;AACA;AACA;AAEA;EACA,eAAA;EACA,eAAA;EACA,kBAAA;EACA,eAAA;EACA,yBAAA;AACA;AAEA;EACA,eAAA;AACA;AAEA;EACA,cAAA;EACA,eAAA;AACA;AAEA;EACA,YAAA;EACA,eAAA;AAEA;IACA,cAAA;IACA,uBAAA;AACA;AACA","file":"DatetimeMonthPicker.vue","sourcesContent":["<template>\n  <div class=\"vdatetime-month-picker\">\n    <div class=\"vdatetime-month-picker__list vdatetime-month-picker__list\" ref=\"monthList\">\n      <div class=\"vdatetime-month-picker__item\" v-for=\"month in months\" @click=\"select(month)\" :class=\"{'vdatetime-month-picker__item--selected': month.selected, 'vdatetime-month-picker__item--disabled': month.disabled}\">{{ month.label }}\n      </div>\n    </div>\n  </div>\n</template>\n\n<script>\nimport { DateTime } from 'luxon'\nimport { monthIsDisabled, months } from './util'\n\nexport default {\n  props: {\n    year: {\n      type: Number,\n      required: true\n    },\n    month: {\n      type: Number,\n      required: true\n    },\n    minDate: {\n      type: DateTime,\n      default: null\n    },\n    maxDate: {\n      type: DateTime,\n      default: null\n    }\n  },\n\n  computed: {\n    months () {\n      return months(this.month).map((month, index) => ({\n        number: ++index,\n        label: month,\n        selected: index === this.month,\n        disabled: !index || monthIsDisabled(this.minDate, this.maxDate, this.year, index)\n      }))\n    }\n  },\n\n  methods: {\n    select (month) {\n      if (month.disabled) {\n        return\n      }\n\n      this.$emit('change', parseInt(month.number))\n    },\n\n    scrollToCurrent () {\n      const selectedMonth = this.$refs.monthList.querySelector('.vdatetime-month-picker__item--selected')\n      this.$refs.monthList.scrollTop = selectedMonth ? selectedMonth.offsetTop - 250 : 0\n    }\n  },\n\n  mounted () {\n    this.scrollToCurrent()\n  },\n\n  updated () {\n    this.scrollToCurrent()\n  }\n}\n</script>\n\n<style>\n.vdatetime-month-picker {\n  box-sizing: border-box;\n\n  &::after {\n    content: '';\n    display: table;\n    clear: both;\n  }\n\n  & * {\n    box-sizing: border-box;\n  }\n}\n\n.vdatetime-month-picker__list {\n  float: left;\n  width: 100%;\n  height: 305px;\n  overflow-y: scroll;\n  -webkit-overflow-scrolling: touch;\n\n  &::-webkit-scrollbar {\n    width: 3px;\n  }\n\n  &::-webkit-scrollbar-track {\n    background: #efefef;\n  }\n\n  &::-webkit-scrollbar-thumb {\n    background: #ccc;\n  }\n}\n\n.vdatetime-month-picker__item {\n  padding: 10px 0;\n  font-size: 20px;\n  text-align: center;\n  cursor: pointer;\n  transition: font-size .3s;\n}\n\n.vdatetime-month-picker__item:hover {\n  font-size: 32px;\n}\n\n.vdatetime-month-picker__item--selected {\n  color: #3f51b5;\n  font-size: 32px;\n}\n\n.vdatetime-month-picker__item--disabled {\n  opacity: 0.4;\n  cursor: default;\n\n  &:hover {\n    color: inherit;\n    background: transparent;\n  }\n}\n</style>\n"]}, media: undefined });

  };
  /* scoped */
  var __vue_scope_id__$5 = undefined;
  /* module identifier */
  var __vue_module_identifier__$5 = undefined;
  /* functional template */
  var __vue_is_functional_template__$5 = false;
  /* component normalizer */
  /* style inject */
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  var __vue_component__$5 = /*#__PURE__*/normalizeComponent$1(
    { render: __vue_render__$5, staticRenderFns: __vue_staticRenderFns__$5 },
    __vue_inject_styles__$5,
    __vue_script__$5,
    __vue_scope_id__$5,
    __vue_is_functional_template__$5,
    __vue_module_identifier__$5,
    false,
    createInjector,
    undefined,
    undefined
  );

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

var KEY_TAB = 9;
var KEY_ENTER = 13;
var KEY_ESC = 27;

var script$1 = {
  components: {
    DatetimeCalendar: __vue_component__$2,
    DatetimeTimePicker: __vue_component__$3,
    DatetimeYearPicker: __vue_component__$4,
    DatetimeMonthPicker: __vue_component__$5
  },

  props: {
    datetime: {
      type: luxon.DateTime,
      required: true
    },
    phrases: {
      type: Object,
      default: function default$1 () {
        return {
          cancel: 'Cancel',
          ok: 'Ok'
        }
      }
    },
    type: {
      type: String,
      default: 'date'
    },
    use12Hour: {
      type: Boolean,
      default: false
    },
    hourStep: {
      type: Number,
      default: 1
    },
    minuteStep: {
      type: Number,
      default: 1
    },
    minDatetime: {
      type: luxon.DateTime,
      default: null
    },
    maxDatetime: {
      type: luxon.DateTime,
      default: null
    },
    auto: {
      type: Boolean,
      default: false
    },
    weekStart: {
      type: Number,
      default: 1
    },
    flow: {
      type: Array
    },
    title: {
      type: String
    },
    isJapanese: {
      type: Boolean,
      default: false
    }
  },

  data: function data () {
    var flowManager = this.flow
      ? createFlowManager(this.flow)
      : createFlowManagerFromType(this.type);

    return {
      newDatetime: this.datetime,
      flowManager: flowManager,
      step: flowManager.first(),
      timePartsTouched: []
    }
  },

  created: function created () {
    document.addEventListener('keydown', this.onKeyDown);
  },

  beforeDestroy: function beforeDestroy () {
    document.removeEventListener('keydown', this.onKeyDown);
  },

  computed: {
    year: function year () {
      return this.newDatetime.year
    },
    month: function month () {
      return this.newDatetime.month
    },
    day: function day () {
      return this.newDatetime.day
    },
    hour: function hour () {
      return this.newDatetime.hour
    },
    minute: function minute () {
      return this.newDatetime.minute
    },
    dateFormatted: function dateFormatted () {
      return this.newDatetime.toLocaleString({
        month: 'long',
        day: 'numeric'
      })
    },
    minTime: function minTime () {
      return (
        this.minDatetime &&
        this.minDatetime.year === this.year &&
        this.minDatetime.month === this.month &&
        this.minDatetime.day === this.day
      ) ? this.minDatetime.toFormat('HH:mm') : null
    },
    maxTime: function maxTime () {
      return (
        this.maxDatetime &&
        this.maxDatetime.year === this.year &&
        this.maxDatetime.month === this.month &&
        this.maxDatetime.day === this.day
      ) ? this.maxDatetime.toFormat('HH:mm') : null
    }
  },

  methods: {
    nextStep: function nextStep () {
      this.step = this.flowManager.next(this.step);
      this.timePartsTouched = [];

      if (this.step === 'end') {
        this.$emit('confirm', this.newDatetime);
      }
    },
    showYear: function showYear () {
      this.step = 'year';
      this.flowManager.diversion('date');
    },
    showMonth: function showMonth () {
      this.step = 'month';
      this.flowManager.diversion('date');
    },
    confirm: function confirm () {
      this.nextStep();
    },
    cancel: function cancel () {
      this.$emit('cancel');
    },
    onChangeYear: function onChangeYear (year) {
      this.newDatetime = this.newDatetime.set({ year: year });

      if (this.auto) {
        this.nextStep();
      }
    },
    onChangeMonth: function onChangeMonth (month) {
      this.newDatetime = this.newDatetime.set({ month: month });

      if (this.auto) {
        this.nextStep();
      }
    },
    onChangeDate: function onChangeDate (year, month, day) {
      this.newDatetime = this.newDatetime.set({ year: year, month: month, day: day });

      if (this.auto) {
        this.nextStep();
      }
    },
    onChangeTime: function onChangeTime (ref) {
      var hour = ref.hour;
      var minute = ref.minute;
      var suffixTouched = ref.suffixTouched;

      if (suffixTouched) {
        this.timePartsTouched['suffix'] = true;
      }

      if (Number.isInteger(hour)) {
        this.newDatetime = this.newDatetime.set({ hour: hour });
        this.timePartsTouched['hour'] = true;
      }

      if (Number.isInteger(minute)) {
        this.newDatetime = this.newDatetime.set({ minute: minute });
        this.timePartsTouched['minute'] = true;
      }

      var goNext = this.auto && this.timePartsTouched['hour'] && this.timePartsTouched['minute'] && (
        this.timePartsTouched['suffix'] ||
        !this.use12Hour
      );

      if (goNext) {
        this.nextStep();
      }
    },
    onKeyDown: function onKeyDown (event) {
      switch (event.keyCode) {
        case KEY_ESC:
        case KEY_TAB:
          this.cancel();
          break

        case KEY_ENTER:
          this.nextStep();
          break
      }
    }
  }
};

/* script */
var __vue_script__$1 = script$1;

/* template */
var __vue_render__$1 = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c("div", { staticClass: "vdatetime-popup" }, [
    _c("div", { staticClass: "vdatetime-popup__header" }, [
      _vm.title
        ? _c("div", { staticClass: "vdatetime-popup__title" }, [
            _vm._v(_vm._s(_vm.title)) ])
        : _vm._e(),
      _vm._v(" "),
      _vm.type !== "time"
        ? _c(
            "div",
            {
              staticClass: "vdatetime-popup__year",
              on: { click: _vm.showYear },
            },
            [_vm._v(_vm._s(_vm.year))]
          )
        : _vm._e(),
      _vm._v(" "),
      _vm.type !== "time"
        ? _c(
            "div",
            {
              staticClass: "vdatetime-popup__date",
              on: { click: _vm.showMonth },
            },
            [_vm._v(_vm._s(_vm.dateFormatted))]
          )
        : _vm._e() ]),
    _vm._v(" "),
    _c(
      "div",
      { staticClass: "vdatetime-popup__body" },
      [
        _vm.step === "year"
          ? _c("datetime-year-picker", {
              attrs: {
                "min-date": _vm.minDatetime,
                "max-date": _vm.maxDatetime,
                year: _vm.year,
              },
              on: { change: _vm.onChangeYear },
            })
          : _vm._e(),
        _vm._v(" "),
        _vm.step === "month"
          ? _c("datetime-month-picker", {
              attrs: {
                "min-date": _vm.minDatetime,
                "max-date": _vm.maxDatetime,
                year: _vm.year,
                month: _vm.month,
              },
              on: { change: _vm.onChangeMonth },
            })
          : _vm._e(),
        _vm._v(" "),
        _vm.step === "date"
          ? _c("datetime-calendar", {
              attrs: {
                year: _vm.year,
                month: _vm.month,
                day: _vm.day,
                "min-date": _vm.minDatetime,
                "max-date": _vm.maxDatetime,
                "week-start": _vm.weekStart,
                isJapanese: _vm.isJapanese,
              },
              on: { change: _vm.onChangeDate },
            })
          : _vm._e(),
        _vm._v(" "),
        _vm.step === "time"
          ? _c("datetime-time-picker", {
              attrs: {
                hour: _vm.hour,
                minute: _vm.minute,
                "use12-hour": _vm.use12Hour,
                "hour-step": _vm.hourStep,
                "minute-step": _vm.minuteStep,
                "min-time": _vm.minTime,
                "max-time": _vm.maxTime,
              },
              on: { change: _vm.onChangeTime },
            })
          : _vm._e() ],
      1
    ),
    _vm._v(" "),
    _c("div", { staticClass: "vdatetime-popup__actions" }, [
      _c(
        "div",
        {
          staticClass:
            "vdatetime-popup__actions__button vdatetime-popup__actions__button--cancel",
          on: { click: _vm.cancel },
        },
        [
          _vm._t(
            "button-cancel__internal",
            function () {
              return [_vm._v(_vm._s(_vm.phrases.cancel))]
            },
            { step: _vm.step }
          ) ],
        2
      ),
      _vm._v(" "),
      _c(
        "div",
        {
          staticClass:
            "vdatetime-popup__actions__button vdatetime-popup__actions__button--confirm",
          on: { click: _vm.confirm },
        },
        [
          _vm._t(
            "button-confirm__internal",
            function () {
              return [_vm._v(_vm._s(_vm.phrases.ok))]
            },
            { step: _vm.step }
          ) ],
        2
      ) ]) ])
};
var __vue_staticRenderFns__$1 = [];
__vue_render__$1._withStripped = true;

  /* style */
  var __vue_inject_styles__$1 = function (inject) {
    if (!inject) { return }
    inject("data-v-33b09e02_0", { source: "\n.vdatetime-popup {\n  box-sizing: border-box;\n  z-index: 1000;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  width: 340px;\n  max-width: calc(100% - 30px);\n  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);\n  color: #444;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif;\n  line-height: 1.18;\n  background: #fff;\n  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);\n& * {\n    box-sizing: border-box;\n}\n}\n.vdatetime-popup__header {\n  padding: 18px 30px;\n  background: #3f51b5;\n  color: #fff;\n  font-size: 32px;\n}\n.vdatetime-popup__title {\n  margin-bottom: 8px;\n  font-size: 21px;\n  font-weight: 300;\n}\n.vdatetime-popup__year {\n  font-weight: 300;\n  font-size: 14px;\n  opacity: 0.7;\n  cursor: pointer;\n  transition: opacity .3s;\n&:hover {\n    opacity: 1;\n}\n}\n.vdatetime-popup__date {\n  line-height: 1;\n  cursor: pointer;\n}\n.vdatetime-popup__actions {\n  padding: 0 20px 10px 30px;\n  text-align: right;\n}\n.vdatetime-popup__actions__button {\n  display: inline-block;\n  border: none;\n  padding: 10px 20px;\n  background: transparent;\n  font-size: 16px;\n  color: #3f51b5;\n  cursor: pointer;\n  transition: color .3s;\n&:hover {\n    color: #444;\n}\n}\n", map: {"version":3,"sources":["/home/ec2-user/vue-datetime/src/DatetimePopup.vue"],"names":[],"mappings":";AAsRA;EACA,sBAAA;EACA,aAAA;EACA,eAAA;EACA,QAAA;EACA,SAAA;EACA,gCAAA;EACA,YAAA;EACA,4BAAA;EACA,0CAAA;EACA,WAAA;EACA,8JAAA;EACA,iBAAA;EACA,gBAAA;EACA,6CAAA;AAEA;IACA,sBAAA;AACA;AACA;AAEA;EACA,kBAAA;EACA,mBAAA;EACA,WAAA;EACA,eAAA;AACA;AAEA;EACA,kBAAA;EACA,eAAA;EACA,gBAAA;AACA;AAEA;EACA,gBAAA;EACA,eAAA;EACA,YAAA;EACA,eAAA;EACA,uBAAA;AAEA;IACA,UAAA;AACA;AACA;AAEA;EACA,cAAA;EACA,eAAA;AACA;AAEA;EACA,yBAAA;EACA,iBAAA;AACA;AAEA;EACA,qBAAA;EACA,YAAA;EACA,kBAAA;EACA,uBAAA;EACA,eAAA;EACA,cAAA;EACA,eAAA;EACA,qBAAA;AAEA;IACA,WAAA;AACA;AACA","file":"DatetimePopup.vue","sourcesContent":["<template>\n  <div class=\"vdatetime-popup\">\n    <div class=\"vdatetime-popup__header\">\n      <div class=\"vdatetime-popup__title\" v-if=\"title\">{{ title }}</div>\n      <div class=\"vdatetime-popup__year\" @click=\"showYear\" v-if=\"type !== 'time'\">{{ year }}</div>\n      <div class=\"vdatetime-popup__date\" @click=\"showMonth\" v-if=\"type !== 'time'\">{{ dateFormatted }}</div>\n    </div>\n    <div class=\"vdatetime-popup__body\">\n      <datetime-year-picker\n          v-if=\"step === 'year'\"\n          @change=\"onChangeYear\"\n          :min-date=\"minDatetime\"\n          :max-date=\"maxDatetime\"\n          :year=\"year\"></datetime-year-picker>\n      <datetime-month-picker\n          v-if=\"step === 'month'\"\n          @change=\"onChangeMonth\"\n          :min-date=\"minDatetime\"\n          :max-date=\"maxDatetime\"\n          :year=\"year\"\n          :month=\"month\"></datetime-month-picker>\n      <datetime-calendar\n          v-if=\"step === 'date'\"\n          @change=\"onChangeDate\"\n          :year=\"year\"\n          :month=\"month\"\n          :day=\"day\"\n          :min-date=\"minDatetime\"\n          :max-date=\"maxDatetime\"\n          :week-start=\"weekStart\"\n          :isJapanese=\"isJapanese\"\n      ></datetime-calendar>\n      <datetime-time-picker\n          v-if=\"step === 'time'\"\n          @change=\"onChangeTime\"\n          :hour=\"hour\"\n          :minute=\"minute\"\n          :use12-hour=\"use12Hour\"\n          :hour-step=\"hourStep\"\n          :minute-step=\"minuteStep\"\n          :min-time=\"minTime\"\n          :max-time=\"maxTime\"></datetime-time-picker>\n    </div>\n    <div class=\"vdatetime-popup__actions\">\n      <div class=\"vdatetime-popup__actions__button vdatetime-popup__actions__button--cancel\" @click=\"cancel\">\n        <slot name=\"button-cancel__internal\" v-bind:step=\"step\">{{ phrases.cancel }}</slot>\n      </div>\n      <div class=\"vdatetime-popup__actions__button vdatetime-popup__actions__button--confirm\" @click=\"confirm\">\n        <slot name=\"button-confirm__internal\" v-bind:step=\"step\">{{ phrases.ok }}</slot>\n      </div>\n    </div>\n  </div>\n</template>\n\n<script>\nimport { DateTime } from 'luxon'\nimport { createFlowManager, createFlowManagerFromType } from './util'\nimport DatetimeCalendar from './DatetimeCalendar'\nimport DatetimeTimePicker from './DatetimeTimePicker'\nimport DatetimeYearPicker from './DatetimeYearPicker'\nimport DatetimeMonthPicker from './DatetimeMonthPicker'\n\nconst KEY_TAB = 9\nconst KEY_ENTER = 13\nconst KEY_ESC = 27\n\nexport default {\n  components: {\n    DatetimeCalendar,\n    DatetimeTimePicker,\n    DatetimeYearPicker,\n    DatetimeMonthPicker\n  },\n\n  props: {\n    datetime: {\n      type: DateTime,\n      required: true\n    },\n    phrases: {\n      type: Object,\n      default () {\n        return {\n          cancel: 'Cancel',\n          ok: 'Ok'\n        }\n      }\n    },\n    type: {\n      type: String,\n      default: 'date'\n    },\n    use12Hour: {\n      type: Boolean,\n      default: false\n    },\n    hourStep: {\n      type: Number,\n      default: 1\n    },\n    minuteStep: {\n      type: Number,\n      default: 1\n    },\n    minDatetime: {\n      type: DateTime,\n      default: null\n    },\n    maxDatetime: {\n      type: DateTime,\n      default: null\n    },\n    auto: {\n      type: Boolean,\n      default: false\n    },\n    weekStart: {\n      type: Number,\n      default: 1\n    },\n    flow: {\n      type: Array\n    },\n    title: {\n      type: String\n    },\n    isJapanese: {\n      type: Boolean,\n      default: false\n    }\n  },\n\n  data () {\n    const flowManager = this.flow\n      ? createFlowManager(this.flow)\n      : createFlowManagerFromType(this.type)\n\n    return {\n      newDatetime: this.datetime,\n      flowManager,\n      step: flowManager.first(),\n      timePartsTouched: []\n    }\n  },\n\n  created () {\n    document.addEventListener('keydown', this.onKeyDown)\n  },\n\n  beforeDestroy () {\n    document.removeEventListener('keydown', this.onKeyDown)\n  },\n\n  computed: {\n    year () {\n      return this.newDatetime.year\n    },\n    month () {\n      return this.newDatetime.month\n    },\n    day () {\n      return this.newDatetime.day\n    },\n    hour () {\n      return this.newDatetime.hour\n    },\n    minute () {\n      return this.newDatetime.minute\n    },\n    dateFormatted () {\n      return this.newDatetime.toLocaleString({\n        month: 'long',\n        day: 'numeric'\n      })\n    },\n    minTime () {\n      return (\n        this.minDatetime &&\n        this.minDatetime.year === this.year &&\n        this.minDatetime.month === this.month &&\n        this.minDatetime.day === this.day\n      ) ? this.minDatetime.toFormat('HH:mm') : null\n    },\n    maxTime () {\n      return (\n        this.maxDatetime &&\n        this.maxDatetime.year === this.year &&\n        this.maxDatetime.month === this.month &&\n        this.maxDatetime.day === this.day\n      ) ? this.maxDatetime.toFormat('HH:mm') : null\n    }\n  },\n\n  methods: {\n    nextStep () {\n      this.step = this.flowManager.next(this.step)\n      this.timePartsTouched = []\n\n      if (this.step === 'end') {\n        this.$emit('confirm', this.newDatetime)\n      }\n    },\n    showYear () {\n      this.step = 'year'\n      this.flowManager.diversion('date')\n    },\n    showMonth () {\n      this.step = 'month'\n      this.flowManager.diversion('date')\n    },\n    confirm () {\n      this.nextStep()\n    },\n    cancel () {\n      this.$emit('cancel')\n    },\n    onChangeYear (year) {\n      this.newDatetime = this.newDatetime.set({ year })\n\n      if (this.auto) {\n        this.nextStep()\n      }\n    },\n    onChangeMonth (month) {\n      this.newDatetime = this.newDatetime.set({ month })\n\n      if (this.auto) {\n        this.nextStep()\n      }\n    },\n    onChangeDate (year, month, day) {\n      this.newDatetime = this.newDatetime.set({ year, month, day })\n\n      if (this.auto) {\n        this.nextStep()\n      }\n    },\n    onChangeTime ({ hour, minute, suffixTouched }) {\n      if (suffixTouched) {\n        this.timePartsTouched['suffix'] = true\n      }\n\n      if (Number.isInteger(hour)) {\n        this.newDatetime = this.newDatetime.set({ hour })\n        this.timePartsTouched['hour'] = true\n      }\n\n      if (Number.isInteger(minute)) {\n        this.newDatetime = this.newDatetime.set({ minute })\n        this.timePartsTouched['minute'] = true\n      }\n\n      const goNext = this.auto && this.timePartsTouched['hour'] && this.timePartsTouched['minute'] && (\n        this.timePartsTouched['suffix'] ||\n        !this.use12Hour\n      )\n\n      if (goNext) {\n        this.nextStep()\n      }\n    },\n    onKeyDown (event) {\n      switch (event.keyCode) {\n        case KEY_ESC:\n        case KEY_TAB:\n          this.cancel()\n          break\n\n        case KEY_ENTER:\n          this.nextStep()\n          break\n      }\n    }\n  }\n}\n</script>\n\n<style>\n.vdatetime-popup {\n  box-sizing: border-box;\n  z-index: 1000;\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  width: 340px;\n  max-width: calc(100% - 30px);\n  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3);\n  color: #444;\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif;\n  line-height: 1.18;\n  background: #fff;\n  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);\n\n  & * {\n    box-sizing: border-box;\n  }\n}\n\n.vdatetime-popup__header {\n  padding: 18px 30px;\n  background: #3f51b5;\n  color: #fff;\n  font-size: 32px;\n}\n\n.vdatetime-popup__title {\n  margin-bottom: 8px;\n  font-size: 21px;\n  font-weight: 300;\n}\n\n.vdatetime-popup__year {\n  font-weight: 300;\n  font-size: 14px;\n  opacity: 0.7;\n  cursor: pointer;\n  transition: opacity .3s;\n\n  &:hover {\n    opacity: 1;\n  }\n}\n\n.vdatetime-popup__date {\n  line-height: 1;\n  cursor: pointer;\n}\n\n.vdatetime-popup__actions {\n  padding: 0 20px 10px 30px;\n  text-align: right;\n}\n\n.vdatetime-popup__actions__button {\n  display: inline-block;\n  border: none;\n  padding: 10px 20px;\n  background: transparent;\n  font-size: 16px;\n  color: #3f51b5;\n  cursor: pointer;\n  transition: color .3s;\n\n  &:hover {\n    color: #444;\n  }\n}\n</style>\n"]}, media: undefined });

  };
  /* scoped */
  var __vue_scope_id__$1 = undefined;
  /* module identifier */
  var __vue_module_identifier__$1 = undefined;
  /* functional template */
  var __vue_is_functional_template__$1 = false;
  /* component normalizer */
  /* style inject */
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  var __vue_component__$1 = /*#__PURE__*/normalizeComponent$1(
    { render: __vue_render__$1, staticRenderFns: __vue_staticRenderFns__$1 },
    __vue_inject_styles__$1,
    __vue_script__$1,
    __vue_scope_id__$1,
    __vue_is_functional_template__$1,
    __vue_module_identifier__$1,
    false,
    createInjector,
    undefined,
    undefined
  );

//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

var script = {
  components: {
    DatetimePopup: __vue_component__$1
  },

  inheritAttrs: false,

  props: {
    value: {
      type: String
    },
    valueZone: {
      type: String,
      default: 'UTC'
    },
    inputId: {
      type: String,
      default: null
    },
    inputClass: {
      type: [Object, Array, String],
      default: ''
    },
    inputStyle: {
      type: [Object, Array, String],
      default: ''
    },
    hiddenName: {
      type: String
    },
    zone: {
      type: String,
      default: 'local'
    },
    format: {
      type: [Object, String],
      default: null
    },
    type: {
      type: String,
      default: 'date'
    },
    phrases: {
      type: Object,
      default: function default$1 () {
        return {
          cancel: 'Cancel',
          ok: 'Ok'
        }
      }
    },
    use12Hour: {
      type: Boolean,
      default: false
    },
    hourStep: {
      type: Number,
      default: 1
    },
    minuteStep: {
      type: Number,
      default: 1
    },
    minDatetime: {
      type: String,
      default: null
    },
    maxDatetime: {
      type: String,
      default: null
    },
    auto: {
      type: Boolean,
      default: false
    },
    weekStart: {
      type: Number,
      default: function default$2 () {
        return weekStart()
      }
    },
    flow: {
      type: Array
    },
    title: {
      type: String
    },
    hideBackdrop: {
      type: Boolean,
      default: false
    },
    backdropClick: {
      type: Boolean,
      default: true
    },
    isJapanese: {
      type: Boolean,
      default: false
    }
  },

  data: function data () {
    return {
      isOpen: false,
      datetime: datetimeFromISO(this.value)
    }
  },

  watch: {
    value: function value (newValue) {
      this.datetime = datetimeFromISO(newValue);
    }
  },

  created: function created () {
    this.emitInput();
  },

  computed: {
    inputValue: function inputValue () {
      var format = this.format;

      if (!format) {
        switch (this.type) {
          case 'date':
            format = luxon.DateTime.DATE_MED;
            break
          case 'time':
            format = luxon.DateTime.TIME_24_SIMPLE;
            break
          case 'datetime':
          case 'default':
            format = luxon.DateTime.DATETIME_MED;
            break
        }
      }

      if (typeof format === 'string') {
        return this.datetime ? luxon.DateTime.fromISO(this.datetime).setZone(this.zone).toFormat(format) : ''
      } else {
        return this.datetime ? this.datetime.setZone(this.zone).toLocaleString(format) : ''
      }
    },
    popupDate: function popupDate () {
      return this.datetime ? this.datetime.setZone(this.zone) : this.newPopupDatetime()
    },
    popupMinDatetime: function popupMinDatetime () {
      return this.minDatetime ? luxon.DateTime.fromISO(this.minDatetime).setZone(this.zone) : null
    },
    popupMaxDatetime: function popupMaxDatetime () {
      return this.maxDatetime ? luxon.DateTime.fromISO(this.maxDatetime).setZone(this.zone) : null
    }
  },

  methods: {
    emitInput: function emitInput () {
      var datetime = this.datetime ? this.datetime.setZone(this.valueZone) : null;

      if (datetime && this.type === 'date') {
        datetime = startOfDay(datetime);
      }

      this.$emit('input', datetime ? datetime.toISO() : '');
    },
    open: function open (event) {
      event.target.blur();

      this.isOpen = true;
    },
    close: function close () {
      this.isOpen = false;
      this.$emit('close');
    },
    confirm: function confirm (datetime) {
      this.datetime = datetime.toUTC();
      this.emitInput();
      this.close();
    },
    cancel: function cancel () {
      this.close();
    },
    clickOutside: function clickOutside () {
      if (this.backdropClick === true) { this.cancel(); }
    },
    newPopupDatetime: function newPopupDatetime () {
      var datetime = luxon.DateTime.utc().setZone(this.zone).set({ seconds: 0, milliseconds: 0 });

      if (this.popupMinDatetime && datetime < this.popupMinDatetime) {
        datetime = this.popupMinDatetime.set({ seconds: 0, milliseconds: 0 });
      }

      if (this.popupMaxDatetime && datetime > this.popupMaxDatetime) {
        datetime = this.popupMaxDatetime.set({ seconds: 0, milliseconds: 0 });
      }

      if (this.minuteStep === 1) {
        return datetime
      }

      var roundedMinute = Math.round(datetime.minute / this.minuteStep) * this.minuteStep;

      if (roundedMinute === 60) {
        return datetime.plus({ hours: 1 }).set({ minute: 0 })
      }

      return datetime.set({ minute: roundedMinute })
    },
    setValue: function setValue (event) {
      this.datetime = datetimeFromISO(event.target.value);
      this.emitInput();
    }
  }
};

/* script */
var __vue_script__ = script;

/* template */
var __vue_render__ = function () {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    { staticClass: "vdatetime" },
    [
      _vm._t("before"),
      _vm._v(" "),
      _c(
        "input",
        _vm._g(
          _vm._b(
            {
              staticClass: "vdatetime-input",
              class: _vm.inputClass,
              style: _vm.inputStyle,
              attrs: { id: _vm.inputId, type: "text" },
              domProps: { value: _vm.inputValue },
              on: { click: _vm.open, focus: _vm.open },
            },
            "input",
            _vm.$attrs,
            false
          ),
          _vm.$listeners
        )
      ),
      _vm._v(" "),
      _vm.hiddenName
        ? _c("input", {
            attrs: { type: "hidden", name: _vm.hiddenName },
            domProps: { value: _vm.value },
            on: { input: _vm.setValue },
          })
        : _vm._e(),
      _vm._v(" "),
      _vm._t("after"),
      _vm._v(" "),
      _c(
        "transition-group",
        { attrs: { name: "vdatetime-fade", tag: "div" } },
        [
          _vm.isOpen && !_vm.hideBackdrop
            ? _c("div", {
                key: "overlay",
                staticClass: "vdatetime-overlay",
                on: {
                  click: function ($event) {
                    if ($event.target !== $event.currentTarget) {
                      return null
                    }
                    return _vm.clickOutside.apply(null, arguments)
                  },
                },
              })
            : _vm._e(),
          _vm._v(" "),
          _vm.isOpen
            ? _c("datetime-popup", {
                key: "popup",
                attrs: {
                  type: _vm.type,
                  datetime: _vm.popupDate,
                  phrases: _vm.phrases,
                  "use12-hour": _vm.use12Hour,
                  "hour-step": _vm.hourStep,
                  "minute-step": _vm.minuteStep,
                  "min-datetime": _vm.popupMinDatetime,
                  "max-datetime": _vm.popupMaxDatetime,
                  auto: _vm.auto,
                  "week-start": _vm.weekStart,
                  flow: _vm.flow,
                  title: _vm.title,
                  isJapanese: _vm.isJapanese,
                },
                on: { confirm: _vm.confirm, cancel: _vm.cancel },
                scopedSlots: _vm._u(
                  [
                    {
                      key: "button-cancel__internal",
                      fn: function (scope) {
                        return [
                          _vm._t(
                            "button-cancel",
                            function () {
                              return [_vm._v(_vm._s(_vm.phrases.cancel))]
                            },
                            { step: scope.step }
                          ) ]
                      },
                    },
                    {
                      key: "button-confirm__internal",
                      fn: function (scope) {
                        return [
                          _vm._t(
                            "button-confirm",
                            function () {
                              return [_vm._v(_vm._s(_vm.phrases.ok))]
                            },
                            { step: scope.step }
                          ) ]
                      },
                    } ],
                  null,
                  true
                ),
              })
            : _vm._e() ],
        1
      ) ],
    2
  )
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  var __vue_inject_styles__ = function (inject) {
    if (!inject) { return }
    inject("data-v-2946b2d9_0", { source: "\n.vdatetime-fade-enter-active,\n.vdatetime-fade-leave-active {\n  transition: opacity .4s;\n}\n.vdatetime-fade-enter,\n.vdatetime-fade-leave-to {\n  opacity: 0;\n}\n.vdatetime-overlay {\n  z-index: 999;\n  position: fixed;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  background: rgba(0, 0, 0, 0.5);\n  transition: opacity .5s;\n}\n", map: {"version":3,"sources":["/home/ec2-user/vue-datetime/src/Datetime.vue"],"names":[],"mappings":";AA2QA;;EAEA,uBAAA;AACA;AAEA;;EAEA,UAAA;AACA;AAEA;EACA,YAAA;EACA,eAAA;EACA,MAAA;EACA,QAAA;EACA,SAAA;EACA,OAAA;EACA,8BAAA;EACA,uBAAA;AACA","file":"Datetime.vue","sourcesContent":["<template>\n  <div class=\"vdatetime\">\n    <slot name=\"before\"></slot>\n    <input class=\"vdatetime-input\"\n           :class=\"inputClass\"\n           :style=\"inputStyle\"\n           :id=\"inputId\"\n           type=\"text\"\n           :value=\"inputValue\"\n           v-bind=\"$attrs\"\n           v-on=\"$listeners\"\n           @click=\"open\"\n           @focus=\"open\">\n    <input v-if=\"hiddenName\" type=\"hidden\" :name=\"hiddenName\" :value=\"value\" @input=\"setValue\">\n    <slot name=\"after\"></slot>\n    <transition-group name=\"vdatetime-fade\" tag=\"div\">\n      <div key=\"overlay\" v-if=\"isOpen && !hideBackdrop\" class=\"vdatetime-overlay\" @click.self=\"clickOutside\"></div>\n      <datetime-popup\n          key=\"popup\"\n          v-if=\"isOpen\"\n          :type=\"type\"\n          :datetime=\"popupDate\"\n          :phrases=\"phrases\"\n          :use12-hour=\"use12Hour\"\n          :hour-step=\"hourStep\"\n          :minute-step=\"minuteStep\"\n          :min-datetime=\"popupMinDatetime\"\n          :max-datetime=\"popupMaxDatetime\"\n          @confirm=\"confirm\"\n          @cancel=\"cancel\"\n          :auto=\"auto\"\n          :week-start=\"weekStart\"\n          :flow=\"flow\"\n          :title=\"title\"\n          :isJapanese=\"isJapanese\">\n        <template slot=\"button-cancel__internal\" slot-scope=\"scope\">\n          <slot name=\"button-cancel\" v-bind:step=\"scope.step\">{{ phrases.cancel }}</slot>\n        </template>\n        <template slot=\"button-confirm__internal\" slot-scope=\"scope\">\n          <slot name=\"button-confirm\" v-bind:step=\"scope.step\">{{ phrases.ok }}</slot>\n        </template>\n      </datetime-popup>\n    </transition-group>\n  </div>\n</template>\n\n<script>\nimport { DateTime } from 'luxon'\nimport DatetimePopup from './DatetimePopup'\nimport { datetimeFromISO, startOfDay, weekStart } from './util'\n\nexport default {\n  components: {\n    DatetimePopup\n  },\n\n  inheritAttrs: false,\n\n  props: {\n    value: {\n      type: String\n    },\n    valueZone: {\n      type: String,\n      default: 'UTC'\n    },\n    inputId: {\n      type: String,\n      default: null\n    },\n    inputClass: {\n      type: [Object, Array, String],\n      default: ''\n    },\n    inputStyle: {\n      type: [Object, Array, String],\n      default: ''\n    },\n    hiddenName: {\n      type: String\n    },\n    zone: {\n      type: String,\n      default: 'local'\n    },\n    format: {\n      type: [Object, String],\n      default: null\n    },\n    type: {\n      type: String,\n      default: 'date'\n    },\n    phrases: {\n      type: Object,\n      default () {\n        return {\n          cancel: 'Cancel',\n          ok: 'Ok'\n        }\n      }\n    },\n    use12Hour: {\n      type: Boolean,\n      default: false\n    },\n    hourStep: {\n      type: Number,\n      default: 1\n    },\n    minuteStep: {\n      type: Number,\n      default: 1\n    },\n    minDatetime: {\n      type: String,\n      default: null\n    },\n    maxDatetime: {\n      type: String,\n      default: null\n    },\n    auto: {\n      type: Boolean,\n      default: false\n    },\n    weekStart: {\n      type: Number,\n      default () {\n        return weekStart()\n      }\n    },\n    flow: {\n      type: Array\n    },\n    title: {\n      type: String\n    },\n    hideBackdrop: {\n      type: Boolean,\n      default: false\n    },\n    backdropClick: {\n      type: Boolean,\n      default: true\n    },\n    isJapanese: {\n      type: Boolean,\n      default: false\n    }\n  },\n\n  data () {\n    return {\n      isOpen: false,\n      datetime: datetimeFromISO(this.value)\n    }\n  },\n\n  watch: {\n    value (newValue) {\n      this.datetime = datetimeFromISO(newValue)\n    }\n  },\n\n  created () {\n    this.emitInput()\n  },\n\n  computed: {\n    inputValue () {\n      let format = this.format\n\n      if (!format) {\n        switch (this.type) {\n          case 'date':\n            format = DateTime.DATE_MED\n            break\n          case 'time':\n            format = DateTime.TIME_24_SIMPLE\n            break\n          case 'datetime':\n          case 'default':\n            format = DateTime.DATETIME_MED\n            break\n        }\n      }\n\n      if (typeof format === 'string') {\n        return this.datetime ? DateTime.fromISO(this.datetime).setZone(this.zone).toFormat(format) : ''\n      } else {\n        return this.datetime ? this.datetime.setZone(this.zone).toLocaleString(format) : ''\n      }\n    },\n    popupDate () {\n      return this.datetime ? this.datetime.setZone(this.zone) : this.newPopupDatetime()\n    },\n    popupMinDatetime () {\n      return this.minDatetime ? DateTime.fromISO(this.minDatetime).setZone(this.zone) : null\n    },\n    popupMaxDatetime () {\n      return this.maxDatetime ? DateTime.fromISO(this.maxDatetime).setZone(this.zone) : null\n    }\n  },\n\n  methods: {\n    emitInput () {\n      let datetime = this.datetime ? this.datetime.setZone(this.valueZone) : null\n\n      if (datetime && this.type === 'date') {\n        datetime = startOfDay(datetime)\n      }\n\n      this.$emit('input', datetime ? datetime.toISO() : '')\n    },\n    open (event) {\n      event.target.blur()\n\n      this.isOpen = true\n    },\n    close () {\n      this.isOpen = false\n      this.$emit('close')\n    },\n    confirm (datetime) {\n      this.datetime = datetime.toUTC()\n      this.emitInput()\n      this.close()\n    },\n    cancel () {\n      this.close()\n    },\n    clickOutside () {\n      if (this.backdropClick === true) { this.cancel() }\n    },\n    newPopupDatetime () {\n      let datetime = DateTime.utc().setZone(this.zone).set({ seconds: 0, milliseconds: 0 })\n\n      if (this.popupMinDatetime && datetime < this.popupMinDatetime) {\n        datetime = this.popupMinDatetime.set({ seconds: 0, milliseconds: 0 })\n      }\n\n      if (this.popupMaxDatetime && datetime > this.popupMaxDatetime) {\n        datetime = this.popupMaxDatetime.set({ seconds: 0, milliseconds: 0 })\n      }\n\n      if (this.minuteStep === 1) {\n        return datetime\n      }\n\n      const roundedMinute = Math.round(datetime.minute / this.minuteStep) * this.minuteStep\n\n      if (roundedMinute === 60) {\n        return datetime.plus({ hours: 1 }).set({ minute: 0 })\n      }\n\n      return datetime.set({ minute: roundedMinute })\n    },\n    setValue (event) {\n      this.datetime = datetimeFromISO(event.target.value)\n      this.emitInput()\n    }\n  }\n}\n</script>\n\n<style>\n.vdatetime-fade-enter-active,\n.vdatetime-fade-leave-active {\n  transition: opacity .4s;\n}\n\n.vdatetime-fade-enter,\n.vdatetime-fade-leave-to {\n  opacity: 0;\n}\n\n.vdatetime-overlay {\n  z-index: 999;\n  position: fixed;\n  top: 0;\n  right: 0;\n  bottom: 0;\n  left: 0;\n  background: rgba(0, 0, 0, 0.5);\n  transition: opacity .5s;\n}\n</style>\n"]}, media: undefined });

  };
  /* scoped */
  var __vue_scope_id__ = undefined;
  /* module identifier */
  var __vue_module_identifier__ = undefined;
  /* functional template */
  var __vue_is_functional_template__ = false;
  /* component normalizer */
  /* style inject */
  /* style inject SSR */
  
  /* style inject shadow dom */
  

  
  var __vue_component__ = /*#__PURE__*/normalizeComponent$1(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    false,
    createInjector,
    undefined,
    undefined
  );

function plugin (Vue) {
  Vue.component('datetime', __vue_component__);
  Vue.component('datetime-popup', __vue_component__$1);
}

// Install by default if using the script tag
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(plugin);
}

var version = '1.0.0-beta.13';

exports['default'] = plugin;
exports.Datetime = __vue_component__;
exports.DatetimePopup = __vue_component__$1;
exports.version = version;

Object.defineProperty(exports, '__esModule', { value: true });

})));
