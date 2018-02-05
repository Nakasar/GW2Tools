var signedIn = false;
var thisUser;
var signInCallback;

function showLoginModal() {
  if (signedIn) {
    $('#disconnect').show();
    $('#login-form').hide();
    $('#login-modal-label').text("Déconnexion");
  } else {
    $('#login-form').show();
    $('#login-modal-label').text("Connexion");
    $('#disconnect').hide();
  }
  $('#signup-success-alert').hide();
  $('#login-alert').hide();
  $('#login-modal').modal('show');
}

function askForDisconnect() {
  showLoginModal();
}

function establishConnectionCallback(callback) {
  signInCallback = callback;
  $('#nav-connect').show();
  $('#nav-account').hide();
  $('#nav-disconnet').hide();

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
          url: 'https://gw2rp-tools.ovh/api/me',
          data: { id: id, token: token },
          dataType: 'json',
          success: function(json) {
            if (json.success) {
              // user is logged in.
              signedIn = true;
              $('#nav-connect').hide();
              $('#nav-account').show();
              $('#nav-disconnet').show();
              thisUser = new User(json.user.id, json.user.nick_name, json.user.admin, "", token);

              if (thisUser.admin) {
                $('#nav-documentation').after(`<li class="nav-item" id="nav-admin"><a href="/pages/admin" class="nav-link">Admin</a></li>`);
              }

              callback(true);
            } else {
              // Do nothing, token is invalid.
              callback(false);
            }
          },
          error: function(json) {
            displayAPIAlert();
            callback(false);
          }
        });
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  } else {
    callback(false);
  }
}

function establishConnection() {
  $('#nav-connect').show();
  $('#nav-account').hide();
  $('#nav-disconnet').hide();

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
          url: 'https://gw2rp-tools.ovh/api/me',
          data: { id: id, token: token },
          dataType: 'json',
          success: function(json) {
            if (json.success) {
              // user is logged in.
              signedIn = true;
              $('#nav-connect').hide();
              $('#nav-account').show();
              $('#nav-disconnet').show();
              thisUser = new User(json.user.id, json.user.nick_name, json.user.admin, "", token);

              if (thisUser.admin) {
                $('#nav-documentation').after(`<li class="nav-item" id="nav-admin"><a href="/pages/admin" class="nav-link">Admin</a></li>`);
              }
            } else {
              // Do nothing, token is invalid.
            }
          },
          error: function(json) {
            displayAPIAlert();
          }
        });
      }
    }
  }
}

function askForSignOut() {
  signOut();
}

function askForSignUp() {
  signUp();
}

function signOut() {
  $('#nav-connect').show();
  $('#nav-account').hide();
  $('#nav-disconnet').hide();

  $('#login-form').show();
  $('#disconnect').text("Déconnecté").addClass('disabled');
  $('#disconnect').hide();

  $('#login-modal-label').text("Connexion");

  signedIn = false;

  if (typeof(Storage) !== "undefined") {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_token");
  }

  if (signInCallback) {
    signInCallback(false);
  }
}

function signIn() {
  if ($('#login-password').val() != "" && $('#login-username').val() != "") {
    $.ajax({
      method: "POST",
      url: 'https://gw2rp-tools.ovh/api/login',
      data: { nick_name: $('#login-username').val(), password: $('#login-password').val()},
      dataType: 'json',
      success: onSignInResponse,
      error: function(json) {
        $('#login-form #login-alert #text').text("Impossible de se connecter au serveur dans les Brumes, le problème vient peut-être de notre côté :/");
        $('#login-form #login-alert').show();
      }
    });
  } else {
    $('#login-form #login-alert').text("Vous devez indiquer votre mot de passe et votre nom d'utilisateur.");
    $('#login-form #login-alert').show();
  }
}

function onSignInResponse(json) {
  if (json.success) {
    $('#login-form #login-alert').hide();
    onSignIn(json);
  } else {
    console.log(json);
    switch (json.code) {
      case "LOG-08":
        $('#login-form #login-alert').text("Vous devez valider votre adresse mail pour utiliser votre compte.");
        break;
      default:
        $('#login-form #login-alert').text("Le nom d'utilisateur et le mot de passe ne correspondent pas.");
        break;
    }
    $('#login-form #login-alert').show();
  }
}

function onSignIn(json) {
  $('#login-password').val('');
  $('#signup-success-alerts').hide();
  $('#login-form').hide();
  $('#disconnect').text("Se déconnecter").removeClass('disabled');
  $('#disconnect').show();

  $('#login-modal-label').text("Déconnexion");

  signedIn = true;
  thisUser = new User(json.user.id, json.user.nick_name, json.user.admin, json.user.email, json.token);

  $('#nav-connect').hide();
  $('#nav-account').show();
  $('#nav-disconnet').show();

  if (thisUser.admin) {
    $('#nav-documentation').after(`<li class="nav-item" id="nav-admin"><a href="/pages/admin" class="nav-link">Admin</a></li>`);
  }

  // Store user data in web storage.
  if (typeof(Storage) !== "undefined") {
    localStorage.setItem("user_nick_name", thisUser.name);
    localStorage.setItem("user_id", thisUser.id);
    localStorage.setItem("user_token", thisUser.token);
  }

  if (signInCallback) {
    signInCallback(true);
  }
}

function displaySignUpAlert(message) {
  $('#signup-alert #text').text(message);
  $('#signup-alert').show();
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
    displaySignUpAlert("Le mot de passe doit contenir au moins 8 caractères dont un chiffre, une majuscule et une minuscule, mais pas de caractères spéciaux ni d'accents.");
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
    var gw2_name = $('#signup-gw2account').val().split(".")[0];
    var gw2_account_id = $('#signup-gw2account').val().split(".")[1];

    $.ajax({
      method: "POST",
      url: 'https://gw2rp-tools.ovh/api/signup',
      data: { nick_name: $('#signup-username').val(), password: $('#signup-password').val(), email: $('#signup-email').val(), gw2_account: gw2_name, gw2_id: gw2_account_id },
      dataType: 'json',
      success: onSignUpResponse,
      error: function(json) {
        $('#login-form #login-alert #text').text("Impossible de se connecter au serveur dans les Brumes, le problème vient peut-être de notre côté :/");
        $('#login-form #login-alert').show();
      }
    });
  }
}

function onSignUpResponse(json) {
  if(json.success) {
    $('#login-username').val(json.user.nick_name);
    $('#signup-success-alert').show();
    $('#signup-modal').modal('hide')
  } else {
    if (json.code == "REG-01") {
      displaySignUpAlert("Ce nom d'utilisateur est déjà enregistré.");
    } else {
      displaySignUpAlert("Impossible de créer le compte, veuillez réessayer ou contacter les développeurs (Nakasar.1592 en jeu).");
    }
  }
}
