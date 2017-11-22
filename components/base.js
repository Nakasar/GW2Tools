const regex_html = /<(.|\n)*?>/;

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

  formatted = text.replace(/\[color=(.+?)\](.+?)\[\/color\]/g, '<span style="color: $1;">$2</span>');
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
