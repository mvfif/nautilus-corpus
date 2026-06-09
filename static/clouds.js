document.addEventListener("DOMContentLoaded", () => {

    const buttons =
        document.querySelectorAll(".album-title");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            button.parentElement
                .classList.toggle("active");

        });

    });

});