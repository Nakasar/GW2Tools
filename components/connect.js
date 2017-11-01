var signedIn = false;
var thisUser;

function establishConnection() {
  $('#nav-connect').show();
  $('#nav-account').hide();

  // Retrive local storage user data if present
  if (typeof(Storage) !== "undefined") {
    var username = localStorage.getItem("user_nick_name");
    var token = localStorage.getItem("user_token");
    var id = localStorage.getItem("user_id");

    if (username) {
      //$('#username').val(username);
      if (token && id) {
        // Request API to check validity of stored token.
        $.ajax({
          method: "POST",
          url: 'http://gw2rp-tools.ovh/api/me',
          data: { id: id, token: token },
          dataType: 'json',
          success: function(json) {
            if (json.success) {
              // user is logged in.
              signedIn = true;
              $('#nav-connect').hide();
              $('#nav-account').show();
              thisUser = new User(json.user.id, json.user.nick_name, json.user.admin, "", token);
            } else {
              // Do nothing, token is invalid.
            }
          }
        });
      }
    }
  }
}

function signOut() {
  signedIn = false;
  $('#nav-connect').show();
  $('#nav-account').hide();

  if (typeof(Storage) !== "undefined") {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_token");
  }
}

function signIn() {

}

function onSignInResponse(json) {

}

function onSignIn(json) {

}

function displaySignUpAlert(message) {

}

function validateSignUp() {
  // Validate username
  var username = $("#signup-username").val();
  if(username == "") {
    displaySignUpAlert("Veuillez renseigner l'ensemble des champs.");
    return false;
  }
  if (username.length > 20) {
    displaySignUpAlert("Le nom d'utilisateur doit être inférieur à vingt caractères.");
    return false;
  }

  // Validate email
  if(!validateEmail($("#signup-email").val())) {
    displaySignUpAlert("Veuillez entrer une adresse mail valide.");
    return false;
  }

  // Validate password
  var password = $("#signup-password").val();
  if(password === "") {
    displaySignUpAlert("Veuillez renseigner l'ensemble des champs.");
    return false;
  }
  var password_regex = (/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/);
  if (!password_regex.test(password)) {
    displaySignUpAlert("Le mot de passe doit contenir au moins 8 caractères dont un chiffre, une majuscule et une minuscule.");
    return false;
  }
  if(password != $("#signup-password-confirm").val() ) {
    displaySignUpAlert("Les mots de passe ne correspondent pas.");
    return false;
  }

  // Validate gw2_account
  var gw2_account = $("#signup-gw2account").val();
  if (gw2_account === "") {
    displaySignUpAlert("Veuillez renseigner l'ensemble des champs.");
    return false;
  }
  var gw2_account_regex = /^([a-zA-Z]{1,}\.[0-9]{4})$/;
  if (!gw2_account_regex.test(gw2_account)) {
    displaySignUpAlert("Le nom de compte est de la forme Nakasar.5192, il se trouve en haut de votre liste de contacts en jeu.");
    return false;
  }

  return true;
}

function validateEmail(email) {
  var email_regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return email_regex.test(email);
}

function signUp() {
  if(validateSignUp()) {
    console.log("validated");
    var gw2_name = $('#signup-gw2account').val().split(".")[0];
    var gw2_account_id = $('#signup-gw2account').val().split(".")[1];

    $.ajax({
      method: "POST",
      url: 'http://gw2rp-tools.ovh/api/signup',
      data: { nick_name: $('#signup-username').val(), password: $('#signup-password').val(), email: $('#signup-email').val(), gw2_account: gw2_name, gw2_id: gw2_account_id },
      dataType: 'json',
      success: onSignUpResponse
    });
  }
}

function onSignUpResponse(json) {
  console.log(json);
  if(json.success) {
    console.log(json);
    $('#username').val(json.user.nick_name);
    $('#signUp-Success').show();
    $('#signUp-Modal').modal('hide')
  } else {
    console.log(json);
    if (json.code == "REG-01") {
      displaySignUpAlert("Ce nom d'utilisateur est déjà enregistré.");
    } else {
      displaySignUpAlert("Impossible de créer le compte, veuillez réessayer ou contacter les développeurs (Nakasar.1592 en jeu).");
    }
  }
}
