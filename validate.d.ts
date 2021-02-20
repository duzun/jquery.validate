
// When return string - url for AJAX
// When return boolean false - url for AJAX
interface PrepRemoteValidation  {
    (
        data: { action: 'validate', field: string, value: string|number, form?: string },
        state: object
    ): string|boolean|object;
}

interface ValidateRules {
    equalto?: string,
    trim?: boolean,
    required?: boolean,
    noclass?: boolean,
    url?: boolean, // is_url
    email?: boolean, // is_email
    domain?: boolean, // is_domain
    number?: boolean, // is_number
    minlength?: number,
    maxlength?: number,
    minval?: number|string,
    maxval?: number|string,
    remote?: string|PrepRemoteValidation,
    [_: string]: boolean|number|string|Promise<boolean>|PrepRemoteValidation|undefined,
}

interface ValidatorOptions {
    rules?: ValidateRules,
    messages?: object,
    fieldGroup?: string,
    hintElement?: string,
    validClass?: string,
    invalidClass?: string,
    [_: string]: any,
}

type JQuerySelector = JQuery.Selector|JQuery.Node|JQuery|HTMLElement;

declare enum ValidatorActions {
    VALIDATE = "validate",
    REFRESH = "refresh",
    ON = "on",
    OFF = "off",
}

/**
 * $.fn.validator()
 */
interface ValidatorPlugin {
    // Action
    (action: ValidatorActions): JQuery;
    (action: 'validate', rules?: ValidateRules, silent?: boolean): JQuery;

    // Init on a form/DOM element
    (options: ValidatorOptions): JQuery;

    handler(this: JQuery, event: object): void;
}


interface ValidateStaticPlugin {
    (
        element: JQuerySelector,
        rules?: ValidateRules,
        callback?: any,
        context?: JQuerySelector
    ): boolean | Promise<boolean>;

    defaults: ValidatorOptions;

    readRules(element: JQuerySelector, rules?: ValidateRules): ValidateRules;
    msg(ruleName: string, fieldName: string, options?: ValidatorOptions, rule?: object, placeholder?: string): string;

}

/**
 * Extend the jQuery result declaration with the plugin.
 */
interface JQuery {
    /**
     * Extension of the example plugin.
     */
    validator: ValidatorPlugin;
    validate: (rules?: ValidateRules, silent?: boolean) => JQuery;
}

interface JQueryStatic {
    validate: ValidateStaticPlugin;
}

declare namespace JQuery.validator {
    function handler(this: JQuery, event: JQuery.Event): void;
}

declare namespace JQueryStatic.validate {
    let defaults: ValidatorOptions;
}

declare namespace JQuery {
    interface Event {
        field: string;
        options: ValidatorOptions;
        src_evt: string;
        message: string;
    }
}

/**
 * For auto-init
 */
interface Window {
    jQuery: JQueryStatic;
    Zepto: JQueryStatic;
}
