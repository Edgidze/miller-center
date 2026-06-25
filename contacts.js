"use strict";

const form = document.querySelector("#contact-form");
const successMessage = document.querySelector("#form-success");

/* Помечает поле как незаполненное (подсветка + подпись) или снимает пометку. */
function setFieldInvalid(field, isInvalid) {
    field.classList.toggle("invalid", isInvalid);
}

/* Проверяет одно поле: считается заполненным, если после удаления пробелов
   в нём остаётся хотя бы один символ. */
function isControlFilled(control) {
    return control.value.trim().length > 0;
}

if (form) {
    const fields = Array.from(form.querySelectorAll(".form-field"));

    // Снимаем пометку об ошибке, как только пользователь начинает вводить текст.
    fields.forEach((field) => {
        const control = field.querySelector("input, textarea");
        if (!control) {
            return;
        }
        control.addEventListener("input", () => {
            if (isControlFilled(control)) {
                setFieldInvalid(field, false);
            }
        });
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        let firstInvalidControl = null;
        let allValid = true;

        fields.forEach((field) => {
            const control = field.querySelector("input, textarea");
            if (!control) {
                return;
            }
            const filled = isControlFilled(control);
            setFieldInvalid(field, !filled);
            if (!filled) {
                allValid = false;
                if (!firstInvalidControl) {
                    firstInvalidControl = control;
                }
            }
        });

        if (!allValid) {
            successMessage.hidden = true;
            // Переводим фокус на первое незаполненное поле для удобства.
            firstInvalidControl.focus();
            return;
        }

        // Все поля заполнены — здесь можно отправить данные на сервер.
        // Пока показываем подтверждение и очищаем форму.
        successMessage.hidden = false;
        form.reset();

        // Прокручиваем колонку к уведомлению, чтобы пользователь точно его увидел.
        successMessage.scrollIntoView({ behavior: "smooth", block: "center" });
    });
}
