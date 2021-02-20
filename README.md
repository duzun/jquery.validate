# Form validation plugin

## Description

This plugin contains a set of validation rules, assigned to each field by
special attributes and classes (eg `<input type="email" required maxlength="100" />`).

Custom rules can be defined per instance. Each custom rule is a `function (value, $element, data)`.
If rule returns `false`, `Error` or a rejected (later) `Promise`, field is invalid,
otherwise the rule is considered passed.

Error message is user as invalid hint.

Promise error should be a string or an object with either .message or .msg field.

## Usage

### Example

```js
$('#myForm')
    .validator({
        fieldGroup: '.form-group',
        hintElement: '.invalid-hint',

        rules: {
            my_field: {
                required: function (value, $elem, data) {
                    if ( !value ) {
                        return new Error('Field is required');
                    }
                },
                unique: function(value, $elem, data) {
                    return $.when($.ajax({ url:'/my/validation', data:{ value: value, rule: data.rule } }));
                },

                number: function(value) { return !isNaN(value) },

                not_number: isNaN
            }
        }
    });
```
