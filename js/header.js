function header(level = 0) {
	if(level == 0) {
		dir = '';
	} else if(level == -1) {
		dir = '../';
	}

	document.write('<header>');
	document.write('<ul class="menu">');
	document.write('	<li class="homeclick" onclick="window.open(\'' + dir + 'index.html\',\'_self\')" id="header_home">Amox-Clav Calculator</li>');
	document.write('	<li onclick="window.open(\'' + dir + 'how.html\',\'_self\')" id="header_how">How Does It Work?</li>');
	document.write('	<li onclick="example();" id="header_ex">Show An Example</li>');
	document.write('	<li onclick="window.open(\'' + dir + 'citation.html\',\'_self\')" id="header_citation">Citation Information</li>');
	document.write('</ul>');
	document.write('</header>');
}