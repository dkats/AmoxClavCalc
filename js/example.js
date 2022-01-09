// Sets a random age, indication, and weight
function example() {
	// Make sure the index page is loaded
	// Get the current path
	var pathlist = window.location.pathname.split("/");
	// If the current path doesn't end in "index.html", load the index page
	if(pathlist[pathlist.length-1] != "index.html" && pathlist[pathlist.length-1] != "") {
		window.open('index.html','_self');
	}

	// Pick and set random indication (but don't pick the blank first option)
	indication_el.selectedIndex = Math.floor(Math.random() * (indication_el.getElementsByTagName('option').length - 1) + 1);

	// Pick random age
	age_arr = ["<3", ">3"];
	age_rand = age_arr[Math.floor(Math.random() * age_arr.length)];

	// Pick and set random weight
	if(age_rand == "<3") {
		// If age <3 months, pick random weight between 2 kg and 8 kg
		wt_el.value = round(Math.floor(Math.random() * 60) / 10 + 2,1);
	} else {
		// If age <3 months, randomly pick if the weight will be <40 kg or >40 kg
		if(Math.floor(Math.random() * 2) == 0) {
			// Pick random weight between 8 kg and 40 kg
			wt_el.value = round(Math.floor(Math.random() * 320) / 10 + 8,1);
		} else {
			// Pick random weight between 40 kg and 80 kg
			wt_el.value = round(Math.floor(Math.random() * 400) / 10 + 40,1);
		}
	}

	// Set random age
	age_el.value = age_rand;

	refresh("indication");
}

