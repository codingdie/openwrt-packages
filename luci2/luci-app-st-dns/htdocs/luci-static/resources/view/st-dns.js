'use strict';
'require view';
'require ui';
'require form';
'require tools.widgets as widgets';

var basicConf = [
	[form.Value, 'server_addr', _('Server address'), _('ServerAddr specifies the address of the server to connect to.<br>By default, this value is "0.0.0.0".'), { datatype: 'ipaddr' }],
	[form.Value, 'server_port', _('Server port'), _('ServerPort specifies the port to connect to the server on.<br>By default, this value is 7000.'), { datatype: 'port' }],
	[form.Value, 'http_proxy', _('HTTP proxy'), _('HttpProxy specifies a proxy address to connect to the server through. If this value is "", the server will be connected to directly.<br>By default, this value is read from the "http_proxy" environment variable.')],
	[form.ListValue, 'log_level', _('Log level'), _('LogLevel specifies the minimum log level. Valid values are "trace", "debug", "info", "warn", and "error".<br>By default, this value is "info".'), { values: ['trace', 'debug', 'info', 'warn', 'error'] }],
	[form.Flag, 'disable_log_color', _('Disable log color'), _('DisableLogColor disables log colors when LogWay == "console" when set to true.'), { datatype: 'bool', default: 'true' }],
	[form.Value, 'token', _('Token'), _('Token specifies the authorization token used to create keys to be sent to the server. The server must have a matching token for authorization to succeed. <br>By default, this value is "".')],
	[form.Value, 'admin_addr', _('Admin address'), _('AdminAddr specifies the address that the admin server binds to.<br>By default, this value is "127.0.0.1".'), { datatype: 'ipaddr' }],
	[form.Value, 'admin_port', _('Admin port'), _('AdminPort specifies the port for the admin server to listen on. If this value is 0, the admin server will not be started.<br>By default, this value is 0.'), { datatype: 'port' }],
	[form.Value, 'admin_user', _('Admin user'), _('AdminUser specifies the username that the admin server will use for login.<br>By default, this value is "admin".')],
	[form.Value, 'admin_pwd', _('Admin password'), _('AdminPwd specifies the password that the admin server will use for login.<br>By default, this value is "admin".'), { password: true }],
	[form.Value, 'assets_dir', _('Assets dir'), _('AssetsDir specifies the local directory that the admin server will load resources from. If this value is "", assets will be loaded from the bundled executable using statik.<br>By default, this value is "".')],
	[form.Flag, 'tcp_mux', _('TCP mux'), _('TcpMux toggles TCP stream multiplexing. This allows multiple requests from a client to share a single TCP connection. If this value is true, the server must have TCP multiplexing enabled as well.<br>By default, this value is true.'), { datatype: 'bool', default: 'true' }],
	[form.Value, 'user', _('User'), _('User specifies a prefix for proxy names to distinguish them from other clients. If this value is not "", proxy names will automatically be changed to "{user}.{proxy_name}".<br>By default, this value is "".')],
	[form.Flag, 'login_fail_exit', _('Exit when login fail'), _('LoginFailExit controls whether or not the client should exit after a failed login attempt. If false, the client will retry until a login attempt succeeds.<br>By default, this value is true.'), { datatype: 'bool', default: 'true' }],
	[form.ListValue, 'protocol', _('Protocol'), _('Protocol specifies the protocol to use when interacting with the server. Valid values are "tcp", "kcp", and "websocket".<br>By default, this value is "tcp".'), { values: ['tcp', 'kcp', 'websocket'] }],
	[form.Flag, 'tls_enable', _('TLS'), _('TLSEnable specifies whether or not TLS should be used when communicating with the server.'), { datatype: 'bool' }],
	[form.Value, 'heartbeat_interval', _('Heartbeat interval'), _('HeartBeatInterval specifies at what interval heartbeats are sent to the server, in seconds. It is not recommended to change this value.<br>By default, this value is 30.'), { datatype: 'uinteger' }],
	[form.Value, 'heartbeat_timeout', _('Heartbeat timeout'), _('HeartBeatTimeout specifies the maximum allowed heartbeat response delay before the connection is terminated, in seconds. It is not recommended to change this value.<br>By default, this value is 90.'), { datatype: 'uinteger' }]
];

function defTabOpts(s, t, opts, params) {
	for (var i = 0; i < opts.length; i++) {
		var opt = opts[i];
		var o = s.taboption(t, opt[0], opt[1], opt[2], opt[3]);
		setParams(o, opt[4]);
		setParams(o, params);
	}
}

function defOpts(s, opts, params) {
	for (var i = 0; i < opts.length; i++) {
		var opt = opts[i];
		var o = s.option(opt[0], opt[1], opt[2], opt[3]);
		setParams(o, opt[4]);
		setParams(o, params);
	}
}


function setParams(o, params) {
	if (!params) return;
	for (var key in params) {
		var val = params[key];
		if (key === 'values') {
			for (var j = 0; j < val.length; j++) {
				var args = val[j];
				if (!Array.isArray(args))
					args = [args];
				o.value.apply(o, args);
			}
		} else if (key === 'depends') {
			if (!Array.isArray(val))
				val = [val];
			for (var j = 0; j < val.length; j++) {
				var args = val[j];
				if (!Array.isArray(args))
					args = [args];
				o.depends.apply(o, args);
			}
		} else {
			o[key] = params[key];
		}
	}
	if (params['datatype'] === 'bool') {
		o.enabled = 'true';
		o.disabled = 'false';
	}
}
return view.extend({
	render: function () {
		var m, s, o;
		m = new form.Map('st-dns', _('st-dns?????????'));

		s = m.section(form.NamedSection, 'common', 'conf');
		s.dynamic = true;

		s.tab('basic', _('????????????'));
		s.tab('init', _('????????????'));

		defTabOpts(s, 'basic', basicConf, { optional: true });

		o = s.taboption('init', form.SectionValue, 'init', form.TypedSection, 'init', _('Startup Settings'));
		s = o.subsection;
		s.anonymous = true;
		s.dynamic = true;

		return m.render();
	}
});
