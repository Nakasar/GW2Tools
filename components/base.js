//const api_url = 'http://localhost:3000/api'
const api_url = 'https://gw2rp-tools.ovh/api'

const regex_html = /<(.|\n)*?>/;
const guild_name_regex = /^([a-zA-Z \-'0-9\u00C0-\u017F]{1,40})$/;

class User {
  constructor(id, name, admin, email, token) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.photo = "";
    this.admin = admin;
    this.signedIn = true;
    this.token = token;
  }

  static noUser() {
    var user = new User(0, "None", "none", "none");
    user.signedIn = false;
    return user;
  }

  toString() {
    return this.name + " - " + this.email + " - " + this.id + " - is admin: " + this.admin;
  }
}

function formatText(text) {
  var formatted = "";
  formatted = text.replace(regex_html, "")
  formatted = formatted.replace(/\[color=(.+?)\](.+?)\[\/color\]/g, '<span style="color: $1;">$2</span>');
  formatted = formatted.replace(/\[b\](.+?)\[\/b\]/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\[i\](.+?)\[\/i\]/g, '<em>$1</em>');
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/\[u\](.+?)\[\/u\]/g, '<u>$1</u>')
  formatted = formatted.replace(/_(.+?)_/g, '<u>$1</u>')
  formatted = formatted.replace(/\\n/g, '<br>')

  return formatted;
}

function deviceCategory() {
  if ($(window).width() <= 576) {
    return "sm";
  } else if ($(window).width() <= 768) {
    return "md";
  } else if ($(window).width() <= 992) {
    return "sm";
  } else {
    return "lg";
  }
}

$(window).resize(function() {
  if (typeof resizeHandler !== "undefined") {
    resizeHandler(deviceCategory());
  }
});


/**
  TRANSLATIONS
*/
const strings = {
  fr: {
    master: "Chef",
    officer: "Officier",
    member: "Membre",
    recruit: "Recrue"
  }
}
function translate(lang, field) {
  try {
    var translation = strings[lang][field]
    return translation
  } catch (e) {
    return ""
  }
}
