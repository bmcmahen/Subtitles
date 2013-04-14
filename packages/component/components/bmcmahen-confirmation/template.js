module.exports = function anonymous(obj) {

  function escape(html) {
    return String(html)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  function section(obj, prop, negate, str) {
    var val = obj[prop];
    if ('function' == typeof val) return val.call(obj, str);
    if (negate) val = !val;
    if (val) return str;
    return '';
  };

  return "\n	<div class='dialog-content " + escape(obj.className) + "'>\n		<span class='title'> " + escape(obj.title) + " </span>\n		<div class='body'>\n			<p>\n				" + escape(obj.content) + "\n			</p>\n		</div>\n		<div class='confirmation-actions'>\n			" + section(obj, "cancel", false, "\n				<button class='cancel'>" + escape(obj.cancel) + "</button>\n			") + "\n			" + section(obj, "okay", false, "\n			<button class='ok main'>" + escape(obj.okay) + "</button>\n			") + "\n		</div>\n	</div>\n"
}