document.getElementById('contactForm').addEventListener('submit', function (event) {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    let isValid = true;

    if (!name) {
        document.getElementById('nameError').textContent = "Name is required.";
        isValid = false;
    } else {
        document.getElementById('nameError').textContent = "";
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('emailError').textContent = "Valid email is required.";
        isValid = false;
    } else {
        document.getElementById('emailError').textContent = "";
    }

    if (!message) {
        document.getElementById('messageError').textContent = "Message is required.";
        isValid = false;
    } else {
        document.getElementById('messageError').textContent = "";
    }

    if (!isValid) {
        event.preventDefault();
    }
});
