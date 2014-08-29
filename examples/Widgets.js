var GUI = GUI || {};


/**
 *  start the application by closing this start button
 *  @param {function} callback
 */
GUI.StartButton = function(callback){
	this.element = $("<div>", {"class" : "StartButton"})
		.appendTo("#Container");
	this.button = $("<button>")
		.button({label: "\u25B6"})
		.click(this.buttonClicked.bind(this))
		.appendTo(this.element);  
	this.callback = callback;
};

GUI.StartButton.prototype.buttonClicked = function(){
	this.element.fadeTo(500, 0, function(){
		$(this).remove();
	});
	this.callback();
};

/**
 *  Tone.Envelope GUI
 *  @param {jQuery} container the jQuery object to put the gui in
 *  @param {Tone.Envelope} envelope  the envelope object
 */
GUI.Envelope = function(container, envelope, title){
	this.envelope = envelope;
	this.element = $("<div>", {"class" : "Envelope"})
		.appendTo(container);
	this.title = $("<div>", {"id" : "Title"})
		.appendTo(this.element)
		.text(title);
	this.attack = this.makeSlider("attack", 0.01, 0.3, "A");
	this.decay = this.makeSlider("decay", 0.01, 0.4, "D");
	this.sustain = this.makeSlider("sustain", 0, 1, "S");
	this.release = this.makeSlider("release", 0.2, 2, "R");
};

GUI.Envelope.prototype.makeSlider = function(attr, min, max, name){
	var self = this;
	var startVal = this.envelope[attr]*1000;
	var slider = $("<div>", {"class" : "Slider"})
		.slider({
			orientation: "vertical",
			range: "min",
			min: min * 1000,
			max: max * 1000,
			value: startVal,
			slide: function(event, ui) {
				var settings = {};
				settings[attr] = ui.value / 1000;
				self.envelope.set(settings);
				label.text(settings[attr].toFixed(3));
			}
		})
		.appendTo(this.element);
	var label = $("<div>", {"class" : "Label Bottom"})
		.text(startVal / 1000)
		.appendTo(slider);
	$("<div>", {"class" : "Label Top"})
		.text(name)
		.appendTo(slider);
	return slider;
};

/**
 *  invoke the callback on an update loop
 */
GUI.onupdate = function(callback){
	GUI._updateList.push(callback);
};

GUI._updateList = [];

GUI._update = function(){
	// requestAnimationFrame(GUI._update);
	setTimeout(GUI._update, 80);
	for (var i = GUI._updateList.length - 1; i >= 0; i--) {
		GUI._updateList[i]();
	}
};

//start it off
GUI._update();

/**
 *  Tone.Meter GUI
 */
GUI.LevelMeter = function(container, meter){
	this.element = $("<div>", {"class" : "LevelMeter"})
		.appendTo(container);
	this.meter = meter;
	this.channels = [];
	for (var i = 0; i < this.meter.channels; i++) {
		this.channels[i] = new GUI.LevelMeter.Channel(this.element, meter, i);
	}
	if (this.meter.channels === 2){
		this.channels[0].setStereo(0);
		this.channels[1].setStereo(1);
	} else {
		this.channels[0].setMono();
	}
};

/**
 *  a single channel of a level meter
 */
GUI.LevelMeter.Channel = function(container, meter, channelNumber){
	this.element = $("<div>", {"class" : "LevelMeterChannel"})
		.appendTo(container);
	this.background = $("<div>", {"id" : "Background"})
		.appendTo(this.element);
	this.level = $("<div>", {"id" : "Level"})
		.appendTo(this.background);
	this.clip = $("<div>", {"id" : "Clip"})
		.appendTo(this.element);
	this.meter = meter;
	this.channelNumber = channelNumber;
	GUI.onupdate(this.update.bind(this));
};

GUI.LevelMeter.Channel.prototype.update = function(){
	var height = Math.max(Math.min(Math.abs(this.meter.getDb(this.channelNumber)), 100), 0);
	this.level.height(height.toFixed(2) + "%");
	if(this.meter.isClipped()){
		this.clip.css({
			"opacity" : 1
		});
	} else {
		this.clip.css({
			"opacity" : 0
		});
	}
};


GUI.LevelMeter.Channel.prototype.setStereo = function(channel){
	if (channel === 0){
		this.element.addClass("Left");
	} else if (channel === 1){
		this.element.addClass("Right");
	}
};

GUI.LevelMeter.Channel.prototype.setMono = function(){
	this.element.addClass("Mono");
};

/**
 *  shows values
 */
GUI.Value = function(container, initial, label, units){
	this.element = $("<div>", {"class" : "Value"})
		.appendTo(container);
	this.label = $("<div>", {"id" : "Label"})
		.appendTo(this.element)
		.text(label);
	this.value = $("<div>", {"id" : "Value"})
		.appendTo(this.element);
	this.units = units || "";
	this.setValue(initial);
};

GUI.Value.prototype.setValue = function(val){
	if (typeof val === "number"){
		val = val.toFixed(2);
	}
	this.value.text(val + " " + this.units);
};

/**
 *  Tone.Meter GUI but for displaying meter values not levels
 */
GUI.ValueMeter = function(container, meter, label){
	this.meter = meter;
	this.element = $("<div>", {"class" : "ValueMeter"})
		.appendTo(container);
	this.value = new GUI.Value(this.element, 0, label);
	GUI.onupdate(this.update.bind(this));
};

GUI.ValueMeter.prototype.update = function(){
	this.value.setValue(this.meter.getValue().toFixed(2));
};

/**
 *  Top Bar with link to github page, menu with examples, and Master Meter
 *  @param {Tone} Tone a link to the Tone object
 */
GUI.TopBar = function(Tone){
	this.element = $("<div>", {"id" : "TopBar"})
		.appendTo("#Container");
	this.hompage = $("<div>", {"id" : "HomePage"})
		.appendTo(this.element)
		.text("Tone.js");
	this.meter = new Tone.Meter(2);
	Tone.Master.connect(this.meter);
	this.meterGUI = new GUI.LevelMeter(this.element, this.meter);
	this.makeDropDown();
};

GUI.TopBar.prototype.makeDropDown = function(){
	var fileName = window.location.pathname.split("/");
	fileName = fileName[fileName.length - 1];
	fileName = fileName.substr(0, fileName.indexOf("."));
	var restOfUrl = window.location.href.substr(0, window.location.href.indexOf(fileName));
	var dropdown = $("<div>", {"id" : "DropDown"})
		.appendTo(this.element);
	var list = $("<select>");
	for (var catName in ExampleList){
		var group = $("<optgroup>").attr("label", catName)
			.appendTo(list);
		var category = ExampleList[catName];
		for (var example in category){
			var option = $("<option>").attr("value", category[example])
				.appendTo(group)
				.text(example);
			if (category[example] === fileName){
				option.attr("selected", "selected");
			}
		}
	}
	// this.dropdown = list.
	list.appendTo(dropdown)
		.selectmenu({
			change: function( event, ui ) {
				window.location.href = restOfUrl + ui.item.value + ".html";
			},
			width : 160
		});
};


/**
 *  a start stop button
 */
GUI.Checkbox = function(container, callback, labelOff, labelOn){
	var checked = false;
	this.id = GUI.Checkbox._idCounter++;
	// var element = $("<input type='checkbox' id='noToneCheckbox"+this.id+"'>\
	// 	<label for='noToneCheckbox"+this.id+"'>start</label>")
	var element = $("<div>", {"class" : "Checkbox"})
		.appendTo(container)
		.text(labelOff)
		.click(function(){
			checked = !checked;
			if (checked){
				element.addClass("pressed");
				element.button({
					"label" : labelOn
				});
			} else {
				element.removeClass("pressed");
				element.button({
					"label" : labelOff
				});
			}
			callback(checked);
		})
		.button();
	this.element = element;
};

GUI.Checkbox._idCounter = 0; 

/**
 *  a start stop button
 */
GUI.Momentary = function(container, callback, labelOff, labelOn){
	var element = $("<div>", {"class" : "Momentary"})
		.text(labelOff)
		.button()
		.appendTo(container)
		.on("mousedown touchstart", function(){
			element.button({
				"label" : labelOn
			});
			callback(true);
		})
		.on("mouseup touchend", function(){
			element.button({
				"label" : labelOff
			});
			callback(false);
		});
	this.element = element;
};

/**
 *  A DROPDOWN MENU
 */
GUI.DropDown = function(container, options, callback){
	this.element = $("<div>", {"class" : "DropDown"})
		.appendTo(container);
	var list = $("<select>");
	for (var i = 0; i < options.length; i++) {
		var optionName = options[i];
		$("<option>").attr("value", optionName)
			.appendTo(list)
			.text(optionName);
	}
	// this.dropdown = list.
	list.appendTo(this.element)
		.selectmenu({
			change: function( event, ui ) {
				callback(ui.item.value);
			}
		});
};


/**
 *  OSCILLATOR
 */
GUI.Oscillator = function(container, oscillator, label){
	this.element = $("<div>", {"class" : "Oscillator"})
		.appendTo(container);
	this.oscillator = oscillator;
	this.label = $("<div>", {"id" : "Label"})
		.appendTo(this.element)
		.text(label);
	this.type = new GUI.DropDown(this.element, ["sine", "square", "sawtooth", "triangle"], function(option){
		oscillator.setType(option);
	});
};