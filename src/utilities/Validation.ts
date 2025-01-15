export const usernameValidator = (username: string): string | null => {
    // check if the given username is a valid username or not
    // It should have a minimum length of 5
    // It should be all in lowercase
    // It should not have any trailing and leading white spaces

    if (username.length < 5) {
        return null; // whenever there is a null return it means that the provided value is not according to the validations
    }

    username = username.toLowerCase().trim();
    return username;
}

export const emailValidator = (email: string): string | null => {
    // check if the email contains @ and . symbol
    // remove all the trailing and leading whitespaces
    // make it all lowercase
    if (!email.includes('@') || !email.includes('.')) {
        return null; 
    }

    email = email.toLowerCase().trim();
    return email;
}

export const passwordValidator = (password: string): string | null => {
    // check if the password is of length 8 at least
    // ideally you should use regular expressions, but for now do it simply
    if (password.length < 8) {
        return null;
    }

    password = password.trim();
    return password;
}