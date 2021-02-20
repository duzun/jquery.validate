/**
 * Form validation plugin.
 *
 * @author Dumitru Uzun (https://DUzun.Me)
 * @version 1.3.0
 */

import {
    esc_quot,
    is_domain,
    is_email,
    is_url,
    getName,
    read_pratr,
    $each,
} from "./util";

/*globals Promise*/

const STRING = "string";
const NUMBER = "number";
const FUNCTION = "function";
const VALID = "valid";
const INVALID = "invalid";
const NS = ".vldtr";

export default function jquery_validate($: JQueryStatic) {
    // ---------------------------------------------------------------------------
    $.fn.validator = fnValidator;
    $.fn.validate = fnValidate;
    $.validate = validate;

    // ---------------------------------------------------------------------------
    fnValidator.handler = handler;
    validate.readRules = readRules;
    validate.msg = msg;

    // ---------------------------------------------------------------------------
    validate.defaults = {
        valid: undefined,

        hintElement: undefined,
        fieldGroup: undefined,

        validClass: VALID,
        invalidClass: INVALID,

        rules: {},

        messages: {
            // Default messages
            //      _: { fieldName: 'message' }

            _: {
                email: "Email is not correct",
                url: "Not a valid URL",
                number: "Not a valid number",
                required: "%f% is required",
                equalto: `Fields don't match`,
                minlength: "%f% must be %r% characters or more",
                maxlength: "%f% must be no more then %r% characters",
            },

            // Field specific messages
            //      fieldName: { ruleName: 'message' }

            password: {
                required: "Password is required",
                equalto: `Passwords don't match`,
            },

            password2: {
                equalto: `Passwords don't match`,
            },

            // email: {
            //  required: 'Please enter an email address'
            // },

            // url: {
            //  required: 'Please enter a valid URL'
            // },

            // number: {
            //  required: 'Please enter a number'
            // },
        },
    };

    // ---------------------------------------------------------------------------
    $.extend(validate, {
        // Expose validation functions:
        is_domain,
        is_url,
        is_email,

        getName,
    });

    // ---------------------------------------------------------------------------
    function fnValidator(options, _rules?, _silent?) {
        const self = this;
        const on = [
                "keyup",
                "input",
                "blur",
                "focusout",
                "change",
                "paste",
                "cut",
                "validate",
            ],
            ev = on.join(NS + " ") + NS;
        if (typeof options == STRING) {
            switch (options) {
                case "validate":
                    return $.fn.validate.call(self, _rules, _silent);
                case "refresh":
                    return _form_refresh.call(self);
                case "off":
                    return self.off(ev, $.fn.validator.handler);
                case "on":
                    return self.on(ev, $.fn.validator.handler);
            }
        }

        options = _prepOptions(options);

        $each(self, function (i, $form) {
            const validatorOpt = $.extend(
                    true,
                    { _invalids: {} /*, _origs:{}*/ },
                    options,
                    $form.data("validatorOpt") || {}
                );
            $form
                .on("dom:update", _form_refresh) // when DOM is manipulated, refresh form
                .on(ev, $.fn.validator.handler)
                .data("validatorOpt", validatorOpt);
        })
        .attr("novalidate", "novalidate");

        _form_refresh.call(self, undefined, true);

        return self;
    }

    function handler(evt) {
        const self = this,
            $this = $(this),
            target = (evt && evt.target) || self,
            $target = $(target),
            name = getName($target),
            toName = "_to_" + name;
        let validatorOpt = $this.data("validatorOpt"),
            delay = 17,
            to;

        if (!name || !$target.is(":input")) return;

        if (validatorOpt) {
            to = validatorOpt[toName];
        } else {
            $this.data("validatorOpt", (validatorOpt = {}));
        }

        let type = evt && evt.type;
        if (type)
            switch (type) {
                case "input": // invoked at keydown (if supported) or any other kind of input
                case "keyup":
                    delay = 250; // typing
                    break;
                case "validate":
                case "focusout":
                case "blur":
                    delay = 0; // done from this input
                    break;
            }

        // Debounce validation
        if (to) clearTimeout(to);
        validatorOpt[toName] = to = setTimeout(function () {
            let rule = validatorOpt.rules;
            if (rule) rule = rule[name];

            $.validate(
                target,
                rule,
                (valid, ret) => {
                    _on_validate(target, valid, ret, rule, {
                        $tgt: $target,
                        $ctx: $this,
                        opt: validatorOpt,
                        evt,
                        name,
                    });
                },
                $this
            );

            delete validatorOpt[toName];
        }, delay);
    }

    // ---------------------------------------------------------------------------
    /**
     *  Validate an element.
     *
     *  @param (callback) clb.call($elem, (bool)valid, (str)rulename, value, (obj)rules)
     */
    function validate(element, rules, clb?, ctx?, options?: ValidatorOptions) {
        const $elem = $(element);
        const valResAttr = "validatorRes";
        let oldVal = $elem.val(),
            val = oldVal,
            t,
            ruleName,
            cause = $elem.data(INVALID),
            _state_: any = {
                // rules: rules,
                // value: val,
                // valid: true,
            },
            _res = function (valid) {
                $elem.data(valResAttr, _state_).prop(VALID, valid);
                if (typeof clb == FUNCTION) {
                    clb.call($elem, valid, _state_);
                }
                if ((t = _state_._clbstk_)) {
                    delete _state_._clbstk_;
                    $.each(t, (i, fn) => {
                        fn.call($elem, valid, _state_);
                    });
                }
                return valid;
            },
            _invalidate = function (rule, x?) {
                _state_.rule = rule; // deprecated
                _state_[INVALID] = rule;
                _state_[VALID] = false;
                if (x) _state_.remote = x;
                $elem.data(INVALID, rule).removeClass(VALID);
                return _res(false);
            },
            _validate = function (x?) {
                _state_.rule = cause; // deprecated
                delete _state_[INVALID];
                _state_[VALID] = true;
                if (x) _state_.remote = x;
                $elem.data(INVALID, null).removeClass(INVALID);
                return _res(true);
            },
            last_ret;

        if (!rules) {
            rules = $.validate.readRules($elem);
            // Ignore last_res for custom rules
            last_ret = $elem.data(valResAttr);
        }

        if (last_ret && !rules["equalto"] && !rules["dynamic"]) {
            if (last_ret.value === val) {
                _state_ = last_ret;
                if (
                    _state_._validating_ &&
                    $.now() - _state_._validating_ < 3e3
                ) {
                    if (typeof clb == FUNCTION) {
                        t = _state_._clbstk_ || (_state_._clbstk_ = []);
                        t[t.length] = clb;
                    }
                }
                else {
                    if (_state_[VALID]) {
                        _validate();
                    } else {
                        _invalidate(_state_[INVALID]);
                    }
                }
                return _state_.valid;
            }
        }

        if (rules[(ruleName = "trim")]) {
            if (typeof val == STRING) {
                val = $.trim(val as string);
            }
            else if (Array.isArray(val)) {
                val = val.map($.trim);
            }
        }
        _state_.rules = rules;
        _state_.value = val;

        if (rules[(ruleName = "required")]) {
            if (val === "") {
                return _invalidate(ruleName);
            }
        }

        ruleName = "minlength";
        if (ruleName in rules) {
            if (val !== "" && String(val).length < rules[ruleName]) {
                return _invalidate(ruleName);
            }
        }
        ruleName = "maxlength";
        if (ruleName in rules) {
            if (-1 < rules[ruleName] && rules[ruleName] < String(val).length) {
                return _invalidate(ruleName);
            }
        }
        if (rules[(ruleName = "equalto")]) {
            t = $elem.data("$" + ruleName); // cache the elem
            if (!t || !t.length) {
                t = $elem.closest("form");
                if (!t.length) t = $("body");
                // element name
                if (rules[ruleName].match(/^[a-z_]/)) {
                    t = t.find('[name="' + esc_quot(rules[ruleName]) + '"]');
                }
                // jQuery selector
                else {
                    t = t.find(rules[ruleName]);
                }
                $elem.data("$" + ruleName, t);
            }
            if (!t.length || t.val() != val) {
                return _invalidate(ruleName);
            }
        }
        if (rules[(ruleName = "noclass")]) {
            if ($elem.hasClass(rules[ruleName])) {
                return _invalidate(ruleName);
            }
        }
        if (rules[(ruleName = "email")]) {
            if (val !== "" && !is_email(val)) {
                return _invalidate(ruleName);
            }
        }
        if (rules[(ruleName = "url")]) {
            if (val !== "" && !is_url(val)) {
                return _invalidate(ruleName);
            }
        }
        if (rules[(ruleName = "domain")]) {
            if (val !== "" && !is_domain(val)) {
                return _invalidate(ruleName);
            }
        }
        if (rules[(ruleName = NUMBER)]) {
            if (val !== "") {
                if (isNaN(+val)) {
                    return _invalidate(ruleName);
                } else {
                    _state_.value = val = parseFloat(val as string);
                }
            }
        }
        ruleName = "maxval";
        if (ruleName in rules) {
            if (val !== "") {
                t = rules[ruleName];
                if (typeof val == NUMBER) t = parseFloat(t);
                if (t < val) {
                    return _invalidate(ruleName);
                }
            }
        }
        ruleName = "minval";
        if (ruleName in rules) {
            if (val !== "") {
                t = rules[ruleName];
                if (typeof val == NUMBER) t = parseFloat(t);
                if (val < t) {
                    return _invalidate(ruleName);
                }
            }
        }

        const asyncs = [];

        $.each(rules, (ruleName, fn) => {
            if (fn && typeof fn == FUNCTION && ruleName != "remote") {
                let t = fn.call(_state_, val, $elem, _state_);
                if (false === t) {
                    return _invalidate(ruleName);
                }
                if ($.type(t) == "error") {
                    _state_.remote = t;
                    return _invalidate(ruleName);
                }
                if (t && t.then) {
                    t.rule = ruleName;
                    asyncs.push(t);
                }
            }
        });

        if (VALID in _state_ && !_state_[VALID]) return false;

        // Server-side validation
        ruleName = "remote";
        if (ruleName in rules) {
            let form = ctx ? $(ctx) : $elem.closest("form"),
                fieldName = getName($elem),
                data: any = { action: "validate", field: fieldName, value: val },
                url = rules[ruleName];

            ctx = form;

            if (form.length) {
                data.form = getName(form);
            } else {
                form = null;
            }
            if (typeof url == FUNCTION) {
                url = url.call($elem, data, _state_);
                if (url === false) {
                    return _invalidate(ruleName);
                    return;
                }
                if ($.isPlainObject(url)) {
                    data = url;
                    url = data.url;
                    delete data.url;
                }
            }
            if (!url) url = form || location.href;
            const xhr = $.when(
                $.ajax({
                    url,
                    data,
                    method: "post",
                    dataType: "json",
                })
            )
                // back-end result must contain { ok: true }, otherwise it is invalid
                .then((dt) => {
                    if (!dt || !dt.ok) {
                        return Promise.reject(dt);
                    }
                });

            asyncs.push(xhr);
        }

        // Async validation
        if (asyncs.length) {
            _state_._validating_ = $.now();
            $elem.data(valResAttr, _state_);
            oldVal = $elem.val();
            let _valid = true;

            let promise = new Promise((resolve, reject) => {
                $.each(asyncs, (idx, x) => {
                    x.then(
                        (dt) => {
                            if (!_valid) return;
                            _state_.remote = dt;
                            if (oldVal == $elem.val()) {
                                let rs =
                                    _state_.remotes || (_state_.remotes = {});
                                rs[x.rule] = dt;
                            }
                        },
                        (error) => {
                            _valid = false;
                            _state_.remote = error;
                            if (oldVal == $elem.val()) {
                                _invalidate(x.rule, error);
                            }
                            reject(error);
                        }
                    );
                });
                Promise.all(asyncs).then((all) => {
                    if (!_valid) return;
                    if (oldVal == $elem.val()) {
                        _validate();
                    }
                    resolve(all);
                }, $.noop); // this reject is irelevant, because we catch each individual promise
            });

            const _done = () => {
                delete _state_._validating_;
            };
            promise.then(_done, _done);
            return promise;
        }

        return _validate();
    }

    // ---------------------------------------------------------------------------
    function readRules(element, rules) {
        if (!(element instanceof $)) element = $(element);
        let _rules = element.data("validation-rules");
        if (!_rules) {
            _rules = {};
            var type = read_pratr(element, "type");
            if (element.hasClass("trim")) _rules["trim"] = true;

            $.each(["email", "url", "domain", NUMBER], function (t: any, r) {
                t = read_pratr(element, r);
                if (t == null && type == r) {
                    t = true;
                }
                if (t != undefined) _rules[r] = t;
            });

            if (_rules.email) _rules.maxlength = 320;

            $.each(["minlength", "maxlength", "trim"], function (t: any, r) {
                t = read_pratr(element, r);
                if (t != undefined && -1 < (t = parseInt(t))) _rules[r] = t;
            });
            $.each(
                [
                    "minval",
                    "maxval",
                    "required",
                    "equalto",
                    "noclass",
                    "remote",
                ],
                function (t, r) {
                    t = read_pratr(element, r);
                    if (t != undefined) _rules[r] = t;
                }
            );

            if (type == NUMBER) {
                $.each({ min: "minval", max: "maxval" }, function (t, r) {
                    if (!(r in _rules)) {
                        t = read_pratr(element, t);
                        if (t != undefined) _rules[r] = parseFloat(t);
                    }
                });
            }
            element.data("validation-rules", _rules);
        }
        $.extend(rules || (rules = {}), _rules);
        return rules;
    }

    function msg(ruleName, fieldName, options?, rule?, placeholder?): string {
        options = _prepOptions(options);

        const { messages } = options;
        let message: any;

        ((message = messages[fieldName]) && (message = message[ruleName])) ||
            ((message = messages._) && (message = message[ruleName]));
        if (message) {
            if (!rule) (rule = options.rules) && (rule = rule[fieldName]);
            let field = placeholder || fieldName.toUCFirst();
            let ruleValue = rule[ruleName];
            message = message.replace(/%f%/g, `"${field}"`);
            if (placeholder != undefined) {
                message = message.replace(/%p%/g, placeholder);
            }
            if (ruleValue != undefined) {
                message = message.replace(/%r%/g, ruleValue);
            }
        }
        return message;
    }

    // ---------------------------------------------------------------------------
    function fnValidate(rules, silent: boolean) {
        $.validate(this, rules, function (valid, ret) {
            if (!silent) {
                _on_validate(this, valid, ret, rules, {});
            }
        });
        return this;
    }

    // ---------------------------------------------------------------------------
    function _form_refresh(evt, _init) {
        // log('validator:form_refresh', this, evt);
        const self = evt ? $(this) : this;
        return $each(self, function (i, $form, d) {
            const options = $form.data("validatorOpt");
            if (!$form.is(":input")) {
                const $elements = $form.find("[name]:input,[data-name]:input"),
                    _invalids = options._invalids,
                    elByName = {};
                let has_inv;
                $each($elements, function (t, $element) {
                    const fieldName = getName($element);
                    // disabled elements don't get validated (they are not sent to server anyways)
                    if ($element.prop("disabled")) {
                        if (fieldName && _invalids) delete _invalids[fieldName]; // in the case it became invalid
                        return;
                    }
                    if (fieldName) {
                        elByName[fieldName] = $element[0];
                        const rule = $.validate.readRules($element, options.rules[fieldName]);
                        $element.data("_orig_val_") != undefined ||
                            $element.data("_orig_val_", $element.val());
                        if (rule && !$.isEmptyObject(rule)) {
                            options.rules[fieldName] = rule;
                            const valid = $.validate($element, rule);
                            if (valid) {
                                delete _invalids[fieldName];
                            }
                            else {
                                has_inv = !valid;
                                t = _invalids[fieldName] || (_invalids[fieldName] = {});
                                t[$element.data("invalid")] = $element.val();
                            }
                        }
                    }
                });

                // unmark invalid elements that are no longer present in DOM or are disabled
                $.each(_invalids, function (n) {
                    if (!elByName[n]) {
                        delete _invalids[n];
                    }
                });

                // First trigger
                options.valid = has_inv;

                setTimeout(function () {
                    _form_state_trigger($(d), options);
                }, 10);
            }
        });
    }

    function _form_state_trigger(form, opt, valid?) {
        // if valid state changed
        if (!opt) opt = form.data("validatorOpt");
        if (valid == null) valid = $.isEmptyObject(opt._invalids);
        if (!opt.valid !== !valid) {
            opt.valid = valid;
            typeof form.prop("valid") == "object" || form.prop("valid", valid);
            if (valid) {
                form.removeClass(INVALID);
                form.trigger("valid:form", [opt]);
            } else {
                form.addClass(INVALID).removeClass(VALID);
                form.trigger("invalid:form", [opt]);
            }
        }
        return opt.valid;
    }

    function _on_validate(tgt, valid, ret, rules, params) {
        let _evt = new $.Event(valid ? VALID : INVALID),
            rn = ret.invalid,
            $tgt = params.$tgt || $(tgt),
            $ctx = params.$ctx || $tgt.closest("form"),
            name = params.name || getName($tgt), // hidden name
            validatorOpt = params.opt || $ctx.data("validatorOpt"),
            t: any;
        $.extend(_evt, ret);
        _evt.field = name;
        if (validatorOpt) _evt.options = validatorOpt;
        if ((t = params.evt)) _evt.src_evt = t;
        if (valid) {
            if ((t = ret.remote && ret.remote.success)) {
                if (typeof t == STRING) {
                    _evt.message = t;
                }
            }
            $tgt.removeClass(INVALID).addClass(VALID);
        } else {
            if ((t = ret.remote)) {
                _evt.message =
                    (t && (t.msg || t.message || t.description)) || t;
            } else {
                var placeholder = read_pratr($tgt, "placeholder"); // hidden placeholder
                _evt.message = $.validate.msg(
                    rn,
                    name,
                    validatorOpt,
                    rules || ret.rules,
                    placeholder
                );
            }
            $tgt.removeClass(VALID).addClass(INVALID);
        }

        let $fieldGroup;
        if ((t = validatorOpt.fieldGroup)) {
            $fieldGroup = $tgt.closest(t);
            $fieldGroup
                .removeClass(!valid ? VALID : INVALID)
                .addClass(valid ? VALID : INVALID);
        }
        if ((t = validatorOpt.hintElement)) {
            let $hintElement = $tgt.next(t);
            if (!$hintElement.length) {
                $hintElement = $tgt.prev(t);
            }
            if (!$hintElement.length) {
                $hintElement = $tgt.siblings(t).first();
            }
            if (!$hintElement.length && $fieldGroup) {
                $hintElement = $fieldGroup.find(t);
            }
            if ($hintElement) {
                if (valid) {
                    $hintElement.text("").hide();
                } else {
                    _evt.message && $hintElement.text(_evt.message).show();
                }
            }
        }

        $tgt.trigger(_evt, [_evt.message, rn]);

        if (valid && !$tgt.is(":focus")) {
            var form = $ctx.is(":input") ? $ctx.closest("form") : $ctx,
                eq = form.find('[equalto="' + esc_quot(name) + '"]');
            if ((t = $tgt.attr("id")))
                eq = eq.add(form.find('[equalto="#' + esc_quot(name) + '"]'));
            eq.length && eq.trigger("validate");
        }
        if (valid) {
            delete validatorOpt._invalids[name];
            if (!validatorOpt.valid) {
                _form_state_trigger($ctx, validatorOpt);
            }
        } else {
            t =
                validatorOpt._invalids[name] ||
                (validatorOpt._invalids[name] = {});
            t[rn] = ret.value;
            _form_state_trigger($ctx, validatorOpt, valid);
        }
    }

    function _prepOptions(options) {
        return $.isPlainObject(options)
            ? $.extend(true, {}, $.validate.defaults, options)
            : $.validate.defaults;
    }

    // ---------------------------------------------------------------------------
    return $.validate;
}

(function (window: any) {
    const $ = window && (window.jQuery || window.Zepto);
    if ($) jquery_validate($);
})(
    typeof globalThis == "undefined"
        ? typeof window == "undefined"
            ? undefined
            : window
        : globalThis
);
