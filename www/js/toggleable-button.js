/**
 * BoxKite
 *
 * @author Alexander Ryan Shepherd
 * @namespace
 */
if (typeof BoxKite === 'undefined')
	var BoxKite = {};

/**
 * ToggleableButton - Interface for controlling toggleable buttons.
 *
 * @memberof BoxKite
 * @interface
 * @returns {Object} Interface for ToggleableButton.
 */
BoxKite.ToggleableButton = (function() {
  var buttons                 = [];
  
  var rootPrefix              = 'boxkite-toggleable-button';
	var buttonOuterIdPrefix     = rootPrefix;
	var buttonInnerIdPrefix     = rootPrefix + '-inner';
	var buttonInnerTextIdPrefix = rootPrefix + '-inner-text';
	var buttonHandleIdPrefix    = rootPrefix + '-handle';
	var innerCheckboxIdPrefix   = rootPrefix + '-checkbox';
  
	var defaultButtonState      = true;
  var buttonNodes             = [];
	var instanceCount           = 0;
  var onStateValue            = "on";  // default 'on'
  var offStateValue           = "off"; // default 'off'
  
  /**
   * Initialize
   *
   * @param {BoxKite.ToggeableButton~requestCallback} options - Handles user-defined configuration.
   * @public
   */
	var init = function(options) {
    // Set displayed value for both 'on' and 'off'
    if (options !== undefined) {
      onStateValue  = (options.onStateValue  !== undefined) ? options.onStateValue  : onStateValue;
      offStateValue = (options.offStateValue !== undefined) ? options.offStateValue : offStateValue;
    }
    
    // Store array of objects that have class identifier as 'toggleable-button'
    buttonNodes = document.querySelectorAll('.toggleable-button');
    
    // Store length of buttonNodes
    instanceCount = buttonNodes.length;
    
    build();
	};

  /**
   * Build 
   *
   * @private
   */
  var build = function() {
    initializeButtons();
  };
  
  /**
   * Creates a new custom HTML toggleable button object.
   *
   * @private
   * @param {number} instanceId - Reference ID of the button.
   */
  var createButton = function(instance_id) {
    var buttonObj = {};
    
    buttonObj.outer = document.createElement("div");
    buttonObj.outer.setAttribute("id", buttonOuterIdPrefix + "_" + instance_id);
    
    if (buttonNodes[instance_id].className.search("tb-2x") > -1)
      buttonObj.outer.setAttribute("class", "toggleable-button-outer zoom-2");
    else if (buttonNodes[instance_id].className.search("tb-3x") > -1)
      buttonObj.outer.setAttribute("class", "toggleable-button-outer zoom-3");
    else buttonObj.outer.setAttribute("class", "toggleable-button-outer");
    
    buttonObj.outer.setAttribute("onclick", "BoxKite.ToggleableButton.toggle('" + instance_id + "')");
    
    buttonObj.inner = document.createElement("div");
    buttonObj.inner.setAttribute("id", buttonInnerIdPrefix + "_" + instance_id);
    buttonObj.inner.setAttribute("class", "toggleable-button-inner");

    buttonObj.innerText = document.createElement("div");
    buttonObj.innerText.setAttribute("id", buttonInnerTextIdPrefix + "_" + instance_id);
    buttonObj.innerText.setAttribute("class", "toggleable-button-inner-text");

    buttonObj.handle = document.createElement("div");
    buttonObj.handle.setAttribute("id", buttonHandleIdPrefix + "_" + instance_id);
    buttonObj.handle.setAttribute("class", "toggleable-button-handle");
      
    buttonNodes[instance_id].parentNode.insertBefore(buttonObj.outer, buttonNodes[instance_id].nextSibling);
    document.getElementById(buttonOuterIdPrefix + "_" + instance_id).appendChild(buttonObj.inner);
    document.getElementById(buttonInnerIdPrefix + "_" + instance_id).appendChild(buttonObj.handle);
    document.getElementById(buttonInnerIdPrefix + "_" + instance_id).appendChild(buttonObj.innerText);

    if (buttonNodes[instance_id].id === "") buttonNodes[instance_id].setAttribute("id", "toggleable-button" + "_" + instance_id);

    buttons.push({
      id : buttonNodes[instance_id].id
    });

    loadCurrentButtonState(instance_id);
  };
  
  /**
   * Initializes all toggleable buttons.
   * 
   * @private
   */
  var initializeButtons = function() {
		for (var i = 0; i < instanceCount; ++i) {
			createButton(i);
		}
  };
  
  /**
   * Loads current button state.
   *
   * @private
   * @param {number} instanceId - Reference ID of the button.
   */
	var loadCurrentButtonState = function(instanceId) {
		var inputCheckbox = document.getElementById(buttons[instanceId].id);
	
		if (inputCheckbox.checked !== false)
			buttons[instanceId].state = true;
		else buttons[instanceId].state = false;
		
		setButtonPosition(buttons[instanceId].state, instanceId);
	};

  /**
   * Sets position of the inner elements of a specified button.
   * 
   * @private
   * @param {boolean} status - The current status of the button.
   * @param {number} instanceId - Reference ID of the button.
   */
	var setButtonPosition = function(status, instanceId) {
		var buttonHandle    = document.getElementById(buttonHandleIdPrefix    + "_" + instanceId);
		var buttonInner     = document.getElementById(buttonInnerIdPrefix     + "_" + instanceId);
		var buttonInnerText = document.getElementById(buttonInnerTextIdPrefix + "_" + instanceId);
		var inputCheckbox   = document.getElementById(buttons[instanceId].id);
		
		if (status) {
			buttonHandle.style.left = (buttonInner.offsetWidth - buttonHandle.offsetWidth) + "px";
			buttonInnerText.innerHTML = onStateValue;
			buttonInnerText.style.left = "-15px";
			inputCheckbox.checked=true;
		} else {
			buttonHandle.style.left="0px";
			buttonInnerText.innerHTML = offStateValue;
			buttonInnerText.style.left = "20px";
			inputCheckbox.checked=false;
		}
	};
  
  /**
   * Toggles specified button on / off.
   *
   * @public
   * @param {number} instanceId - Reference ID of the button.
   */
	var toggle = function(instanceId) {	
		// Turn on
		if (buttons[instanceId].state) buttons[instanceId].state = false;

		// Turn off
		else buttons[instanceId].state = true;
		
		setButtonPosition(buttons[instanceId].state, instanceId);
	};
  
  return {
    init   : function(options) { return init(options); },
    toggle : function(id) { return toggle(id); }
  };
})();