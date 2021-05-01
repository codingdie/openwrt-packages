'use strict';
'require view';
'require fs';
'require form';
'require tools.widgets as widgets';

return view.extend({
	load: function() {
		return Promise.all([
			L.resolveDefault(fs.stat('/sbin/block'), null),
			L.resolveDefault(fs.stat('/etc/config/fstab'), null),
		]);
	},
	render: function(stats) {
		var m, s, o, v;
		v = '';
		
		m = new form.Map('extroot', _('System'));

		if (stats[5] && stats[5].code === 0) {
			v = stats[5].stdout.trim();
		}
		s = m.section(form.TypedSection, 'first_section', 'extroot ' + v);
		o = s.option(form.Flag, 'some_bool', 'A checkbox option');

		s.tab('general',  _('General Settings'));
		o = s.option(form.ListValue, 'some_choice', 'A select element');
		o.value('choice1', 'The first choice');
		o.value('choice2', 'The second choice');
		
		return m.render();
	}
});
