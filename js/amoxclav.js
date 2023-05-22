// Settings
let clav_min_perkg = 6;
let clav_max_perkg = 10;
let clav_min_abs = 250;
let clav_max_abs = 375;
let amox_error = 0.1;	// Percentage of acceptable dosing error

// Round to a specified number of digits
function round(num, decimals) {
	return (Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals));
}

// Only allow numeric input
function validate(id) {
	let input = document.getElementById(id).value;
	let out = '';
	for(let i = 0; i < input.length; i++) {
		let curr_char = input[i];
		if((curr_char >= '0' && curr_char <= '9') || curr_char <= '.') {
			out += curr_char;
		}
	}

	document.getElementById(id).value = out;
	return(out);
}

// Show/hide rows
function show_rows() {
	switch(show_rows_el.value) {
		case "all":
			for(let i = 0; i < formulations.length; i++) {
				formulations[i].display("");
			}
			break;
		case "appropriate":
			for(let i = 0; i < formulations.length; i++) {
				formulations[i].display(formulations[i].show == true ? "" : "none");
			}
			break;
	}
}

// Show/hide elements
function display_elements(display, list_elements) {
	switch(display) {
		case "show":
			for(let i = 0; i < list_elements.length; i++) {
				list_elements[i].style.display = "";
			}
			break;
		case "hide":
			for(let i = 0; i < list_elements.length; i++) {
				list_elements[i].style.display = "none";
			}
			break;
	}
}

// Show/hide elements
function display_columns() {
	display_elements(show_amox_mgdose_el.value, class_amox_mgdose);
	display_elements(show_amox_mgkgdose_el.value, class_amox_mgkgdose);
	display_elements(show_amox_mgkgday_el.value, class_amox_mgkgday);
}

// Finds Augmentin doses that meet amoxicillin and clavulanate criteria
// Units: concentration mg/pill or mg/mL (NOT mg/5mL), increment (pills or mL), amox_min (mg/dose), amox_max (mg/dose), clav_min (mg/dose), clav_max (mg/dose)
// Output: quantity (either number of pills or number of mL)
function findDoses(amox_concentration, clav_concentration, increment, amox_min, amox_max, clav_min, clav_max) {
	let quant_min = round(Math.ceil(amox_min / amox_concentration / increment) * increment, 1);
	let quant_max = round(Math.floor(amox_max / amox_concentration / increment) * increment, 1);
	let quant_start = round(Math.ceil(((amox_min + amox_max) / 2) / amox_concentration / increment) * increment, 1);

	let quant_high = NaN;
	let quant = quant_start;
	let clav_ok = false;
	while(isNaN(quant_high) && !isNaN(quant_max)) {
		// Calculate the amount of clav in the quantity
		let clav = round(quant * clav_concentration, 1);

		// If the amount of clav is acceptable, store the quantity
		if(clav >= clav_min && clav <= clav_max) {
			quant_high = quant;
			clav_ok = true;
		}

		// Increment
		quant = round((quant + increment), 1);

		// If the incremented quantity > maximum allowable quantity, set the quantity as the starting value
		if(quant > quant_max) {
			quant_high = quant_start;
		}
	}

	let quant_low = NaN;
	if(!(quant_high == round((amox_min + amox_max) / 2 / amox_concentration, 1) && clav_ok == true)) {	
		quant_start = round(quant_start - increment, 1);
		quant = quant_start;
		while(isNaN(quant_low) && !isNaN(quant_min)) {
			// Calculate the amount of clav in the quantity
			let clav = round(quant * clav_concentration, 1);

			// If the amount of clav is acceptable, store the quantity
			if(clav >= clav_min && clav <= clav_max) {
				quant_low = quant;
			}

			// Decrement
			quant = round((quant - increment), 1);

			// If the incremented quantity < minimum allowable quantity, set the quantity as the starting value
			if(quant < quant_min) {
				quant_low = quant_start;
			}
		}
	}

	// Correct floating point error
	quant_low = round(quant_low, 3);
	quant_high = round(quant_high, 3);

	return [quant_low, quant_high].sort();
}

// Wrap in a span depending whether values are within min/max values
function spanWrap(text, value1, min1, max1, value2, min2, max2, perkg = true, tooltip = true) {
	let out = "<span class='";
	if(value1 < min1) {
		out += "primary_low";
	} else if(value1 > max1) {
		out += "primary_high";
	} else {
		if(value2 < min2) {
			out += "secondary_bad";
		} else if(value2 > max2) {
			out += "secondary_bad";
		} else {
			out += "primary_good";
		}
	}
	out += "'>";

	// Open tooltip span
	if(tooltip && (value1 < min1 || value1 > max1)) {
		out += "<span class='tooltip'>";
	}

	out += text;

	// Add tooltip
	if(tooltip && (value1 < min1 || value1 > max1)) {
		out += "<span class='tooltiptext'>";
		if(value1 < min1) {
			out += Math.round((1 - value1 / ((min1 + max1) / 2)) * 100) + "% | " + round(((min1 + max1) / 2 - value1),1) + " mg" + (perkg ? "/kg" : "") + " below desired";
		} else if(value1 > max1) {
			out += Math.round((value1 / ((min1 + max1) / 2) - 1) * 100) + "% | " + round((value1 - (min1 + max1) / 2),1) + " mg" + (perkg ? "/kg" : "") + " above desired";
		}
		out += "</span></span>";
	}

	out += "</span>";

	return out;
}

// Wrap in a span depending on clavulanate value
function spanSecondaryWrap(text, value1, min1, max1, value2, min2, max2) {
	let out = "<span class='";
	if(value1 < min1 || value2 < min2 || value1 > max1 || value2 > max2) {
		out += "secondary_bad";
	} else {
		out += "secondary_good";
	}
	out += "'>" + text + "</span>";
	return out;
}

function headerTooltip(header_text, tooltip_text) {
	return "<span class='tooltip'>" + header_text + "<span class='tooltiptext'>" + tooltip_text + "</span></span>";
}

// Augment class constructor
class augmentin {
	constructor(row, ratio, form, amox_conc, clav_conc, quantity, frequency, amox_dose_perkg, amox_dose_abs, amox_day_perkg, clav_mgkg, clav_mg) {
		this._row = document.getElementById(row);
		this._ratio = ratio;
		this._form = form;
		this._amox_conc = amox_conc;
		this._clav_conc = clav_conc;
		this._quantity = document.getElementById(quantity);
		this._frequency = document.getElementById(frequency);
		this._amox_dose_perkg = document.getElementById(amox_dose_perkg);
		this._amox_dose_abs = document.getElementById(amox_dose_abs);
		this._amox_day_perkg = document.getElementById(amox_day_perkg);
		this._clav_mgkg = document.getElementById(clav_mgkg);
		this._clav_mg = document.getElementById(clav_mg);
		this._show = true;
	}

	// GETTERS
	get row() {
		return this._row;
	}
	get ratio() {
		return this._ratio;
	}

	get form() {
		return this._form;
	}

	get amox_conc() {
		return this._amox_conc;
	}

	get clav_conc() {
		return this._clav_conc;
	}

	get quantity() {
		return this._quantity.innerHTML;
	}

	get frequency() {
		return this._frequency.innerHTML;
	}

	get amox_dose_perkg() {
		return this._amox_dose_perkg.innerHTML;
	}

	get amox_dose_abs() {
		return this._amox_dose_abs.innerHTML;
	}

	get amox_day_perkg() {
		return this._amox_day_perkg.innerHTML;
	}

	get clav_mgkg() {
		return this._clav_mgkg.innerHTML;
	}

	get clav_mg() {
		return this._clav_mg.innerHTML;
	}

	get show() {
		return this._show;
	}

	// SETTERS
	set quantity(x) {
		this._quantity.innerHTML = x;
	}

	set frequency(x) {
		this._frequency.innerHTML = x;
	}

	set amox_dose_perkg(x) {
		this._amox_dose_perkg.innerHTML = x;
	}

	set amox_dose_abs(x) {
		this._amox_dose_abs.innerHTML = x;
	}

	set amox_day_perkg(x) {
		this._amox_day_perkg.innerHTML = x;
	}

	set clav_mgkg(x) {
		this._clav_mgkg.innerHTML = x;
	}

	set clav_mg(x) {
		this._clav_mg.innerHTML = x;
	}

	set show(x) {
		if(typeof(x) == "boolean") {
			this._show = x;
		}
	}

	display(x) {
		this._row.style.display = x;
	}
}

// Element IDs
let age_id = "age";
let indication_id = "indication";
let amox_id = "dose";
let amox_u_id = "dose_u";
let freq_id = "frequency";
let wt_id = "wt";
let th_amox_mgkgdose_id = "th_amox_mgkgdose";
let th_amox_mgdose_id = "th_amox_mgdose";
let th_amox_mgkgday_id = "th_amox_mgkgday";
let th_clav_mgkg_id = "th_clav_mgkg";
let th_clav_mg_id = "th_clav_mg";
let show_rows_id = "show_forms";
let show_amox_mgdose_id = "show_amox_mgdose";
let show_amox_mgkgdose_id = "show_amox_mgkgdose";
let show_amox_mgkgday_id = "show_amox_mgkgday";

let amox_mgdose_class = "amox_mgdose";
let amox_mgkgdose_class = "amox_mgkgdose";
let amox_mgkgday_class = "amox_mgkgday";
let clav_mgkg_class = "clav_mgkg";
let clav_mg_class = "clav_mg";

let t250_id = "t250";
let l125_id = "l125";
let l250_id = "l250";
let t500_id = "t500";
let l200_id = "l200";
let c200_id = "c200";
let l400_id = "l400";
let c400_id = "c400";
let t875_id = "t875";
let l600_id = "l600";
let t1000_id = "t1000";

let t250_quant_id = "t250_quant";
let l125_quant_id = "l125_quant";
let l250_quant_id = "l250_quant";
let t500_quant_id = "t500_quant";
let l200_quant_id = "l200_quant";
let c200_quant_id = "c200_quant";
let l400_quant_id = "l400_quant";
let c400_quant_id = "c400_quant";
let t875_quant_id = "t875_quant";
let l600_quant_id = "l600_quant";
let t1000_quant_id = "t1000_quant";

let t250_freq_id = "t250_freq";
let l125_freq_id = "l125_freq";
let l250_freq_id = "l250_freq";
let t500_freq_id = "t500_freq";
let l200_freq_id = "l200_freq";
let c200_freq_id = "c200_freq";
let l400_freq_id = "l400_freq";
let c400_freq_id = "c400_freq";
let t875_freq_id = "t875_freq";
let l600_freq_id = "l600_freq";
let t1000_freq_id = "t1000_freq";

let t250_amox_dose_perkg_id = "t250_amox_dose_perkg";
let l125_amox_dose_perkg_id = "l125_amox_dose_perkg";
let l250_amox_dose_perkg_id = "l250_amox_dose_perkg";
let t500_amox_dose_perkg_id = "t500_amox_dose_perkg";
let l200_amox_dose_perkg_id = "l200_amox_dose_perkg";
let c200_amox_dose_perkg_id = "c200_amox_dose_perkg";
let l400_amox_dose_perkg_id = "l400_amox_dose_perkg";
let c400_amox_dose_perkg_id = "c400_amox_dose_perkg";
let t875_amox_dose_perkg_id = "t875_amox_dose_perkg";
let l600_amox_dose_perkg_id = "l600_amox_dose_perkg";
let t1000_amox_dose_perkg_id = "t1000_amox_dose_perkg";

let t250_amox_dose_abs_id = "t250_amox_dose_abs";
let l125_amox_dose_abs_id = "l125_amox_dose_abs";
let l250_amox_dose_abs_id = "l250_amox_dose_abs";
let t500_amox_dose_abs_id = "t500_amox_dose_abs";
let l200_amox_dose_abs_id = "l200_amox_dose_abs";
let c200_amox_dose_abs_id = "c200_amox_dose_abs";
let l400_amox_dose_abs_id = "l400_amox_dose_abs";
let c400_amox_dose_abs_id = "c400_amox_dose_abs";
let t875_amox_dose_abs_id = "t875_amox_dose_abs";
let l600_amox_dose_abs_id = "l600_amox_dose_abs";
let t1000_amox_dose_abs_id = "t1000_amox_dose_abs";

let t250_amox_day_perkg_id = "t250_amox_day_perkg";
let l125_amox_day_perkg_id = "l125_amox_day_perkg";
let l250_amox_day_perkg_id = "l250_amox_day_perkg";
let t500_amox_day_perkg_id = "t500_amox_day_perkg";
let l200_amox_day_perkg_id = "l200_amox_day_perkg";
let c200_amox_day_perkg_id = "c200_amox_day_perkg";
let l400_amox_day_perkg_id = "l400_amox_day_perkg";
let c400_amox_day_perkg_id = "c400_amox_day_perkg";
let t875_amox_day_perkg_id = "t875_amox_day_perkg";
let l600_amox_day_perkg_id = "l600_amox_day_perkg";
let t1000_amox_day_perkg_id = "t1000_amox_day_perkg";

let t250_clav_mgkg_id = "t250_clav_mgkg";
let l125_clav_mgkg_id = "l125_clav_mgkg";
let l250_clav_mgkg_id = "l250_clav_mgkg";
let t500_clav_mgkg_id = "t500_clav_mgkg";
let l200_clav_mgkg_id = "l200_clav_mgkg";
let c200_clav_mgkg_id = "c200_clav_mgkg";
let l400_clav_mgkg_id = "l400_clav_mgkg";
let c400_clav_mgkg_id = "c400_clav_mgkg";
let t875_clav_mgkg_id = "t875_clav_mgkg";
let l600_clav_mgkg_id = "l600_clav_mgkg";
let t1000_clav_mgkg_id = "t1000_clav_mgkg";

let t250_clav_mg_id = "t250_clav_mg";
let l125_clav_mg_id = "l125_clav_mg";
let l250_clav_mg_id = "l250_clav_mg";
let t500_clav_mg_id = "t500_clav_mg";
let l200_clav_mg_id = "l200_clav_mg";
let c200_clav_mg_id = "c200_clav_mg";
let l400_clav_mg_id = "l400_clav_mg";
let c400_clav_mg_id = "c400_clav_mg";
let t875_clav_mg_id = "t875_clav_mg";
let l600_clav_mg_id = "l600_clav_mg";
let t1000_clav_mg_id = "t1000_clav_mg";

// Elements
let age_el = document.getElementById(age_id);
let indication_el = document.getElementById(indication_id);
let amox_el = document.getElementById(amox_id);
let amox_u_el = document.getElementById(amox_u_id);
let freq_el = document.getElementById(freq_id);
let wt_el = document.getElementById(wt_id);
let th_amox_mgkgdose_el = document.getElementById(th_amox_mgkgdose_id);
let th_amox_mgdose_el = document.getElementById(th_amox_mgdose_id);
let th_amox_mgkgday_el = document.getElementById(th_amox_mgkgday_id);
let th_clav_mgkg_el = document.getElementById(th_clav_mgkg_id);
let th_clav_mg_el = document.getElementById(th_clav_mg_id);
let show_rows_el = document.getElementById(show_rows_id);
let show_amox_mgdose_el = document.getElementById(show_amox_mgdose_id);
let show_amox_mgkgdose_el = document.getElementById(show_amox_mgkgdose_id);
let show_amox_mgkgday_el = document.getElementById(show_amox_mgkgday_id);

// Classes
let class_amox_mgdose = document.getElementsByClassName(amox_mgdose_class);
let class_amox_mgkgdose = document.getElementsByClassName(amox_mgkgdose_class);
let class_amox_mgkgday = document.getElementsByClassName(amox_mgkgday_class);
let class_clav_mgkg = document.getElementsByClassName(clav_mgkg_class);
let class_clav_mg = document.getElementsByClassName(clav_mg_class);

// Saving header labels
let th_amox_mgkgdose_text = th_amox_mgkgdose_el.innerHTML;
let th_amox_mgdose_text = th_amox_mgdose_el.innerHTML;
let th_amox_mgkgday_text = th_amox_mgkgday_el.innerHTML;
let th_clav_mgkg_text = th_clav_mgkg_el.innerHTML;
let th_clav_mg_text = th_clav_mg_el.innerHTML;

let t250 = new augmentin(t250_id, "2:1", "tablet", 250, 125, t250_quant_id, t250_freq_id, t250_amox_dose_perkg_id, t250_amox_dose_abs_id, t250_amox_day_perkg_id, t250_clav_mgkg_id, t250_clav_mg_id);
let l125 = new augmentin(l125_id, "4:1", "liquid", 125, 31.25, l125_quant_id, l125_freq_id, l125_amox_dose_perkg_id, l125_amox_dose_abs_id, l125_amox_day_perkg_id, l125_clav_mgkg_id, l125_clav_mg_id);
let l250 = new augmentin(l250_id, "4:1", "liquid", 250, 62.5, l250_quant_id, l250_freq_id, l250_amox_dose_perkg_id, l250_amox_dose_abs_id, l250_amox_day_perkg_id, l250_clav_mgkg_id, l250_clav_mg_id);
let t500 = new augmentin(t500_id, "4:1", "tablet", 500, 125, t500_quant_id, t500_freq_id, t500_amox_dose_perkg_id, t500_amox_dose_abs_id, t500_amox_day_perkg_id, t500_clav_mgkg_id, t500_clav_mg_id);
let l200 = new augmentin(l200_id, "7:1", "liquid", 200, 28.5, l200_quant_id, l200_freq_id, l200_amox_dose_perkg_id, l200_amox_dose_abs_id, l200_amox_day_perkg_id, l200_clav_mgkg_id, l200_clav_mg_id);
let c200 = new augmentin(c200_id, "7:1", "chewable", 200, 28.5, c200_quant_id, c200_freq_id, c200_amox_dose_perkg_id, c200_amox_dose_abs_id, c200_amox_day_perkg_id, c200_clav_mgkg_id, c200_clav_mg_id);
let l400 = new augmentin(l400_id, "7:1", "liquid", 400, 57, l400_quant_id, l400_freq_id, l400_amox_dose_perkg_id, l400_amox_dose_abs_id, l400_amox_day_perkg_id, l400_clav_mgkg_id, l400_clav_mg_id);
let c400 = new augmentin(c400_id, "7:1", "chewable", 400, 57, c400_quant_id, c400_freq_id, c400_amox_dose_perkg_id, c400_amox_dose_abs_id, c400_amox_day_perkg_id, c400_clav_mgkg_id, c400_clav_mg_id);
let t875 = new augmentin(t875_id, "7:1", "tablet", 875, 125, t875_quant_id, t875_freq_id, t875_amox_dose_perkg_id, t875_amox_dose_abs_id, t875_amox_day_perkg_id, t875_clav_mgkg_id, t875_clav_mg_id);
let l600 = new augmentin(l600_id, "14:1", "liquid", 600, 42.9, l600_quant_id, l600_freq_id, l600_amox_dose_perkg_id, l600_amox_dose_abs_id, l600_amox_day_perkg_id, l600_clav_mgkg_id, l600_clav_mg_id);
let t1000 = new augmentin(t1000_id, "16:1", "tablet", 1000, 62.5, t1000_quant_id, t1000_freq_id, t1000_amox_dose_perkg_id, t1000_amox_dose_abs_id, t1000_amox_day_perkg_id, t1000_clav_mgkg_id, t1000_clav_mg_id);

let formulations = [t250, l125, l250, t500, l200, c200, l400, c400, t875, l600, t1000];

// Start with clavulanate mg/day column hidden
for(let i = 0; i < class_clav_mg.length; i++) {
	class_clav_mg[i].style.display = "none";
}
// Start by showing/hiding appropriate columns
display_columns();

let amox_day_perkg = NaN;
let amox_dose_perkg = NaN;
let amox_dose_max = NaN;
let amox_day_max = NaN;
let freq = parseInt(freq_el.value);
let wt = NaN;

function refresh(listener) {

	// Get updated values
	let age = age_el.value;
	let indication = indication_el.value;
	let amox = amox_el.value;
	let amox_u = amox_u_el.value;
	freq = parseInt(freq_el.value);
	validate(wt_el.id);
	wt = parseFloat(wt_el.value);

	// Update dose
	if(listener == "dose" || listener == "frequency") {
		switch(amox_u) {
			// If dosing units are mg/kg/DAY
			case "day":
				// Set the daily amox dose per kg
				amox_day_perkg = parseFloat(amox);
				// Calculate the individual amox dose per kg
				amox_dose_perkg = amox_day_perkg / freq;
				break;
			// If dosing units are mg/kg/DOSE
			case "dose":
				// Set the individual amox dose per kg
				amox_dose_perkg = parseFloat(amox);
				// Calculate the daily amox dose
				amox_day_perkg = amox_dose_perkg * freq;
				break;
		}
	}

	if(listener == "indication" || listener == "age") {
		validate(amox_el.id);

		switch(indication) {
			case "":
				amox_day_perkg = "";
				freq = NaN;
				break;
			case "general":
				amox_day_perkg = "";
				freq = NaN;
				break;
			case "impetigo":
				amox_day_perkg = 25;
				freq = 2;
				amox_dose_max = 875;
				break;
			case "aom":
				amox_day_perkg = 90;
				freq = 2;
				amox_day_max = 4000;
				break;
			case "abdominal":
				amox_day_perkg = 45;
				freq = 2;
				amox_dose_max = 875;
				break;
			case "cap":
				amox_day_perkg = 90;
				freq = 2;
				amox_day_max = 4000;
				break;
			case "sinus":
				amox_day_perkg = 45;
				freq = 2;
				amox_dose_max = 875;
				break;
			case "bite":
				amox_day_perkg = 45;
				freq = 2;
				amox_dose_max = 875;
				break;
			case "gas":
				amox_day_perkg = 40;
				freq = 3;
				amox_day_max = 2000;
				amox_dose_max = 500;
				break;
			case "uti":
				amox_day_perkg = 30;
				freq = 3;
				amox_day_max = 2000;
				amox_dose_max = 500;
				break;
		}

		// Calculate the individual amox dose per kg
		amox_dose_perkg = amox_day_perkg / freq;

		// Set dose value
		amox_el.value = amox_day_perkg;

		// Set dose unit to mg/kg/DAY
		if(!isNaN(amox_day_perkg)) {
			amox_u_el.value = "day";
		}

		// If there's a max individual amox dose, set that as the tooltip
		if(!isNaN(amox_dose_max)) {
			th_amox_mgdose_el.innerHTML = headerTooltip(th_amox_mgdose_text, "Max dose: " + amox_dose_max + " mg/dose");	
		}

		// If there's a max daily amox dose, set that as the tooltip
		if(!isNaN(amox_day_max)) {
			th_amox_mgkgday_el.innerHTML = headerTooltip(th_amox_mgkgday_text, "Max dose: " + amox_day_max + " mg/day");	
		}
	}

	// If <3 months old --> 30 mg/kg/day
	if((listener == "age" || listener == "indication") && age == "<3") {
		amox_day_perkg = 30;
		amox_el.value = amox_day_perkg;

		if(!isNaN(freq)) {
			// Calculate the individual amox dose per kg
			amox_dose_perkg = amox_day_perkg / freq;
		}
	}

	// Update frequency
	if(listener == "frequency" || listener == "indication") {
		let frequency = "";
		freq_el.value = freq;

		switch(freq) {
			case 1:
				frequency = "Daily";
				break;
			case 2:
				frequency = "BID";
				break;
			case 3:
				frequency = "TID";
				break;
		}

		// Set frequencies in the output table rows to the selected frequency
		for(let i = 0; i < formulations.length; i++) {
			formulations[i].frequency = frequency;
		}
	}

	// Calculate doses
	if(!isNaN(freq)) {
		if(!isNaN(wt) && wt != "" && wt > 0) {
			if(!isNaN(amox_dose_perkg)) {
				// Set minimum and maximum clavulanate levels based on weight (6-10 mg/kg/day if <40 kg, 250-375 mg/day if ≥40 kg)
				let clav_min = (wt < 40 ? clav_min_perkg : clav_min_abs/wt);
				let clav_max = (wt < 40 ? clav_max_perkg : clav_max_abs/wt);

				if(wt < 40) {
					th_clav_mgkg_el.innerHTML = headerTooltip(th_clav_mgkg_text, "Target: " + clav_min_perkg + "-" + clav_max_perkg + " mg/kg/day");
					// Show clavulanate (mg/kg/day) column
					for(let i = 0; i < class_clav_mgkg.length; i++) {
						class_clav_mgkg[i].style.display = "";
					}
					// Hide clavulanate (mg/day) column
					for(let i = 0; i < class_clav_mg.length; i++) {
						class_clav_mg[i].style.display = "none";
					}
				} else {
					th_clav_mg_el.innerHTML = headerTooltip(th_clav_mg_text, "Target: " + clav_min_abs + "-" + clav_max_abs + " mg/day");
					// Show clavulanate (mg/day) column
					for(let i = 0; i < class_clav_mg.length; i++) {
						class_clav_mg[i].style.display = "";
					}
					// Hide clavulanate (mg/kg/day) column
					for(let i = 0; i < class_clav_mgkg.length; i++) {
						class_clav_mgkg[i].style.display = "none";
					}
				}

				// Store whether at least one row is showing
				let one_row = false;

				// For all the formulations...
				for(let i = 0; i < formulations.length; i++) {
					// Calculate dose increment
					let increment = NaN;
					let liquid_correction = 1;
					switch(formulations[i].form) {
						case "liquid":
							// Divide by five because concentrations are per 5 mL
							liquid_correction = 1/5;

							// Increments of 0.1 mL if volume <3 mL, 0.2 mL if volume >3 mL
							if(amox_dose_perkg * wt / (liquid_correction * formulations[i].amox_conc) >= 3) {
								increment = 0.2;
							} else {
								increment = 0.1;
							}
							break;
						case "tablet":
							// Increments of 1/2 tabs
							increment = 0.5;
							break;
						case "chewable":
							// Increments of 1/2 tabs
							increment = 0.5;
							break;
					}

					// Calculate maximums
					let quant_max = NaN;
					let amox_max = NaN;
					let amox_min = NaN;
					if(!isNaN(amox_day_max)) {
						quant_max = amox_day_max / (formulations[i].amox_conc * liquid_correction) / freq;
						amox_max = Math.min(amox_dose_perkg, amox_day_max / freq / wt);
						amox_min = Math.min(amox_dose_perkg, amox_day_max / freq / wt);
					}
					if(!isNaN(amox_dose_max)) {
						quant_max = amox_dose_max / (formulations[i].amox_conc * liquid_correction);
						amox_max = Math.min(amox_dose_perkg, amox_dose_max / wt);
						amox_min = Math.min(amox_dose_perkg, amox_dose_max / wt);
					}
					// Make sure the maximum quantity is a multiple of the increment
					quant_max = round(quant_max - quant_max % increment, 1);

					// Calculate acceptable amox error (or take max allowable amox dose)
					amox_max = round(amox_max * (1 + amox_error), 3);
					amox_min = round(amox_min * (1 - amox_error), 3);

					// Calculate quantity
					let quant_low = findDoses(formulations[i].amox_conc * liquid_correction, formulations[i].clav_conc * liquid_correction, increment, amox_min * wt, amox_max * wt, clav_min * wt / freq, clav_max * wt / freq);
					let quant_high = (isNaN(quant_low[1]) ? quant_low[0] : quant_low[1]);
					quant_low = quant_low[0];

					// Calculate amoxicillin dose per DOSE
					let amox_low = round(quant_low * formulations[i].amox_conc * liquid_correction / wt, 1);
					let amox_high = round(quant_high * formulations[i].amox_conc * liquid_correction / wt, 1);

					// Calculate clavulanate dose per DAY
					let clav_low = quant_low * formulations[i].clav_conc * liquid_correction * freq / wt;
					let clav_high = quant_high * formulations[i].clav_conc * liquid_correction * freq / wt;

					// Output the HTML either as a single value if rounding up and rounding down are equal or as a range if rounding up vs. down results in different values
					let range_sep = "<br />";
					formulations[i].quantity = (quant_low == quant_high || quant_low == 0 ? spanSecondaryWrap(quant_high, amox_high, amox_min, amox_max, clav_high, clav_min, clav_max) : spanSecondaryWrap(quant_low, amox_low, amox_min, amox_max, clav_low, clav_min, clav_max) + range_sep + spanSecondaryWrap(quant_high, amox_high, amox_min, amox_max, clav_high, clav_min, clav_max));
					formulations[i].amox_dose_perkg = (quant_low == quant_high || quant_low == 0 ? spanWrap(amox_high, amox_high, amox_min, amox_max, clav_high, clav_min, clav_max, true) : spanWrap(amox_low, amox_low, amox_min, amox_max, clav_low, clav_min, clav_max, true) + range_sep + spanWrap(amox_high, amox_high, amox_min, amox_max, clav_high, clav_min, clav_max, true));
					formulations[i].amox_dose_abs = (quant_low == quant_high || quant_low == 0 ? spanWrap(round(quant_high * formulations[i].amox_conc * liquid_correction, 3), round(quant_high * formulations[i].amox_conc * liquid_correction, 3), round(amox_min * wt, 3), round(amox_max * wt, 3), clav_high, clav_min, clav_max, false) : spanWrap(round(quant_low * formulations[i].amox_conc * liquid_correction, 3), round(quant_low * formulations[i].amox_conc * liquid_correction, 3), round(amox_min * wt, 3), round(amox_max * wt, 3), clav_low, clav_min, clav_max, false) + range_sep + spanWrap(round(quant_high * formulations[i].amox_conc * liquid_correction, 3), round(quant_high * formulations[i].amox_conc * liquid_correction, 3), round(amox_min * wt, 3), round(amox_max * wt, 3), clav_high, clav_min, clav_max, false));
					formulations[i].amox_day_perkg = (quant_low == quant_high || quant_low == 0 ? spanWrap(round(amox_high * freq, 3), amox_high * freq, amox_min * freq, amox_max * freq, clav_high, clav_min, clav_max, true) : spanWrap(round(amox_low * freq, 3), amox_low * freq, amox_min * freq, amox_max * freq, clav_low, clav_min, clav_max, true) + range_sep + spanWrap(round(amox_high * freq, 3), amox_high * freq, amox_min * freq, amox_max * freq, clav_high, clav_min, clav_max, true));
					formulations[i].clav_mgkg = (quant_low == quant_high || quant_low == 0 ? spanWrap(round(clav_high,1), clav_high, clav_min, clav_max, amox_high, amox_min, amox_max, false, false) : spanWrap(round(clav_low,1), clav_low, clav_min, clav_max, amox_low, amox_min, amox_max, false, false) + range_sep + spanWrap(round(clav_high,1), clav_high, clav_min, clav_max, amox_high, amox_min, amox_max, false, false));
					formulations[i].clav_mg = (quant_low == quant_high || quant_low == 0 ? spanWrap(round(clav_high * wt,0), clav_high, clav_min, clav_max, amox_high, amox_min, amox_max, false, false) : spanWrap(round(clav_low * wt,0), clav_low, clav_min, clav_max, amox_low, amox_min, amox_max, false, false) + range_sep + spanWrap(round(clav_high * wt,0), clav_high, clav_min, clav_max, amox_high, amox_min, amox_max, false, false));

					// Show the row if the amoxicillin is between amox_min and amox_max (inclusive) AND if the clavulanate is between clav_min and clav_max (inclusive)
					if((amox_low >= amox_min && amox_low <= amox_max && clav_low >= clav_min && clav_low <= clav_max) || (amox_high >= amox_min && amox_high <= amox_max && clav_high >= clav_min && clav_high <= clav_max)) {
						formulations[i].show = true;
						formulations[i].row.classList.add("appropriate");
						formulations[i].row.classList.remove("inappropriate");
						one_row = true;
					} else {
						formulations[i].show = false;
						formulations[i].row.classList.remove("appropriate");
						formulations[i].row.classList.add("inappropriate");
					}
				}

				if(!one_row) {
					show_rows_el.value = "all";
				}
			}
		}
	} else {
		for(let i = 0; i < formulations.length; i++) {
			formulations[i].frequency = "";
		}
	}
	// Augmentin ES is not studied in patients >40 kg
	if(wt > 40) {
		l600.show = false;
		l600.row.classList.remove("appropriate");
		l600.row.classList.add("inappropriate");
	}
	// Augmentin XR only in patients >40 kg
	if(wt < 40) {
		t1000.show = false;
		t1000.row.classList.remove("appropriate");
		t1000.row.classList.add("inappropriate");
	}

	show_rows();
	display_columns();
}

