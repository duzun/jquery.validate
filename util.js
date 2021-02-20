/**
 * Read a property, attribute or data-attribute of an element
 *
 * @param {JQuery<HTMLElement>} $elem
 * @param {String} prop
 *
 * @return {any}
 */
export function read_pratr($elem, prop) {
    let ret = $elem.prop(prop);
    if (ret === "" || ret == null || typeof ret == "object")
        ret = $elem.attr(prop);
    if (ret === "" || ret == null)
        ret = $elem.data(prop);
    return ret;
}
/**
 * Get element's name from either attribute or data-attribute
 *
 * @param  {JQuery<HTMLElement>} $elem
 *
 * @return {String}
 */
export function getName($elem) {
    return $elem.attr("name") || $elem.data("name");
}
// ---------------------------------------------------------------------------
const _eq_r_ = /[\\'"]/g; // Escape for use inside quotes " | '
const _is_url_r_ = /^[a-z]{3,7}\:\/\/[a-z0-9]/i;
const _is_domain_r_ = /^[a-z0-9][0-9a-z_\-]*(?:\.[a-z0-9][0-9a-z_\-]*)*$/;
const _is_email_r_ = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
// - String validation functions -
export function esc_quot(str) {
    return String(str).replace(_eq_r_, "\\$&");
}
export function is_domain(str) {
    return _is_domain_r_.test(str);
}
export function is_url(str) {
    return _is_url_r_.test(str);
}
export function is_email(str) {
    return _is_email_r_.test(str);
}
// ---------------------------------------------------------------------------
/**
 * 4-10 times faster .each replacement
 * use it carefully, as it overrides jQuery context of element on each iteration
 *
 * function clb.call(DOM, idx, $DOM, DOM) {};
 *    $DOM == $(DOM), is the same object throughout iteration
 *
 */
export function $each($list, iterator) {
    const l = $list.length;
    const j = l > 1 ? $list.constructor([0]) : $list;
    let i = -1, d;
    while (++i < l &&
        (j[0] = d = $list[i]) &&
        (!i || (j.context = d)) && // .context is deprecated in jQuery v1.10
        // clb.call("this"=DOM, i=index, j=jQuery object, d=DOM)
        iterator.call(d, i, j, d) !== false)
        ;
    return $list;
}
// ---------------------------------------------------------------------------
export const isEventSupported = (function (_doc) {
    const TAGNAMES = {
        select: "input",
        change: "input",
        submit: "form",
        reset: "form",
        error: "img",
        load: "img",
        abort: "img",
    };
    function isEventSupported(eventName, document = _doc) {
        let el = document.createElement(TAGNAMES[eventName] || "div");
        eventName = "on" + eventName;
        let isSupported = eventName in el;
        if (!isSupported) {
            el.setAttribute(eventName, "return;");
            isSupported = typeof el[eventName] == "function";
        }
        el = null;
        return isSupported;
    }
    return isEventSupported;
})(window.document);
// ---------------------------------------------------------------------------
