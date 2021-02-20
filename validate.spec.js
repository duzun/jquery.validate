// import $ from 'jquery';
// import jquery_validate from './validate';

// jquery_validate($);


$(($) => {
    const $body = $('body');

    describe(`$('#context').validator(options)`, () => {
        $body.append(
        `<form id="form1">
            <div class="fields">
                <div class="field">
                    <input type="text" name="firstname" required minlength="4" maxlength="20" />
                    <input type="text" name="lastname" required maxlength="20" />
                </div>

                <div class="field">
                    <input type="email" name="email" minlength="5" required />
                </div>

                <div class="field">
                    <input type="password" value="" name="password" id="password" minlength="6" required />
                    <div id="about_passwd" style="display:none">Good passwords are hard to guess. Use uncommon words or inside jokes, non-standard uPPercasing, creative spelllling, and non-obvious numbers and symbols.</div>
                </div>

                <div class="field" style="display:none">
                    <input class="form-control valid" type="password" value="" name="password2" id="password2" equalto="password" autofill="off"><div class="placeholder" aria-hidden="true" style="position: absolute; display: none; pointer-events: none; top: 0px; left: 0px; box-sizing: border-box; width: 100%; height: 100%; cursor: text; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.5; background-color: transparent; zoom: 1;">Confirm Master Password*</div>
                </div>

                <div class="field">
                    <button class="btn disabled" type="submit" name="signup" disabled value="1">
                        <span>Create your account</span>
                    </button>
                </div>
            </div>
        </form>`
        );
        console.log(document.body.innerHTML);

        it(`should init the validator on the '#context' element(s)`, async () => {
                console.log({validCount, invalidCount});
                console.log(document.body.innerHTML);
            let validCount = 0;
            let invalidCount = 0;


            const $form = $('#form1')
            .on('valid:form', function (evt, opt) {
                console.log(evt.type, opt);
                ++validCount;
            })
            .on('invalid:form', function (evt, opt) {
                console.log(evt.type, opt);
                ++invalidCount;
            })
            .on('valid', function (evt, opt) {
                console.log(evt.type, opt);
            })
            .on('invalid', function (evt, opt) {
                console.log(evt.type, opt);
            })
            .validator()
            ;

            const $firstname = $form.find(`[name=firstname]:input`);
            const $lastname = $form.find(`[name=lastname]:input`);
            const $email = $form.find(`[name=email]:input`);
            const $password = $form.find(`[name=password]:input`);
            const $password2 = $form.find(`[name=password2]:input`);

            $firstname.val('John').trigger('change');
            $lastname.val('Smith').trigger('change');


            let resolve;
            let prom = new Promise((_resolve) => {
                resolve = _resolve;
            });
            console.log({validCount, invalidCount});

            setTimeout(() => {
                console.log({validCount, invalidCount});
                resolve();
            }, 2000);

            return prom;
        });
    });
});

