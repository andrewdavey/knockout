/// <reference path="bindingAttributeSyntax.js" />

ko.bindingHandlers.click = {
    init: function (element, value, allBindings, viewModel) {
        ko.utils.registerEventHandler(element, "click", function (event) {
            try { value.call(viewModel); }
            finally {
                if (event.preventDefault)
                    event.preventDefault();
                else
                    event.returnValue = false;
            }
        });
    }
};

ko.bindingHandlers.submit = {
    init: function (element, value, allBindings, viewModel) {
        if (typeof value != "function")
            throw new Error("The value for a submit binding must be a function to invoke on submit");
        ko.utils.registerEventHandler(element, "submit", function (event) {
            try { value.call(viewModel); }
            finally {
                if (event.preventDefault)
                    event.preventDefault();
                else
                    event.returnValue = false;
            }
        });
    }
};

ko.bindingHandlers.visible = {
    update: function (element, value) {
        value = ko.utils.unwrapObservable(value);
        var isCurrentlyVisible = !(element.style.display == "none");
        if (value && !isCurrentlyVisible)
            element.style.display = "";
        else if ((!value) && isCurrentlyVisible)
            element.style.display = "none";
    }
}

ko.bindingHandlers.enable = {
    update: function (element, value) {
        value = ko.utils.unwrapObservable(value);
        if (value && element.disabled)
            element.removeAttribute("disabled");
        else if ((!value) && (!element.disabled))
            element.disabled = true;
    }
};

ko.bindingHandlers.disable = { update: function (element, value) { ko.bindingHandlers.enable.update(element, !ko.utils.unwrapObservable(value)); } };

ko.bindingHandlers.value = {
    init: function (element, value, allBindings) {
        var eventName = allBindings.valueUpdate || "change";
        if (ko.isWriteableObservable(value))
            ko.utils.registerEventHandler(element, eventName, function () { value(this.value); });
        else if (allBindings._ko_property_writers && allBindings._ko_property_writers.value)
            ko.utils.registerEventHandler(element, eventName, function () { allBindings._ko_property_writers.value(this.value); });
    },
    update: function (element, value) {
        var newValue = ko.utils.unwrapObservable(value);

        if (newValue != element.value) {
            var applyValueAction = function () { element.value = newValue; };
            applyValueAction();

            // Workaround for IE6 bug: It won't reliably apply values to SELECT nodes during the same execution thread
            // right after you've changed the set of OPTION nodes on it. So for that node type, we'll schedule a second thread
            // to apply the value as well.
            var alsoApplyAsynchronously = element.tagName == "SELECT";
            if (alsoApplyAsynchronously)
                setTimeout(applyValueAction, 0);
        }
    }
};

ko.bindingHandlers.options = {
    update: function (element, value, allBindings) {
        if (element.tagName != "SELECT")
            throw new Error("values binding applies only to SELECT elements");

        var previousSelectedValues = ko.utils.arrayMap(ko.utils.arrayFilter(element.childNodes, function (node) {
            return node.tagName && node.tagName == "OPTION" && node.selected;
        }), function (node) {
            return node.value || node.innerText || node.textContent;
        });

        value = ko.utils.unwrapObservable(value);
        var selectedValue = element.value;
        element.innerHTML = "";
        if (value) {
            if (typeof value.length != "number")
                value = [value];
            for (var i = 0, j = value.length; i < j; i++) {
                var option = document.createElement("OPTION");
                var optionValue = typeof allBindings.options_value == "string" ? value[i][allBindings.options_value] : value[i];
                option.value = optionValue.toString();
                option.innerHTML = (typeof allBindings.options_text == "string" ? value[i][allBindings.options_text] : optionValue).toString();
                element.appendChild(option);
            }
            // IE6 doesn't like us to assign selection to OPTION nodes before they're added to the document.
            // That's why we first added them without selection. Now it's time to set the selection.
            var newOptions = element.getElementsByTagName("OPTION");
            for (var i = 0, j = newOptions.length; i < j; i++) {
                if (ko.utils.arrayIndexOf(previousSelectedValues, newOptions[i].value) >= 0)
                    newOptions[i].selected = true;
            }
        }
    }
};

ko.bindingHandlers.selectedOptions = {
    getSelectedValuesFromSelectNode: function (selectNode) {
        var result = [];
        var nodes = selectNode.childNodes;
        for (var i = 0, j = nodes.length; i < j; i++) {
            var node = nodes[i];
            if ((node.tagName == "OPTION") && node.selected)
                result.push(node.value);
        }
        return result;
    },
    init: function (element, value, allBindings) {
        if (ko.isWriteableObservable(value))
            ko.utils.registerEventHandler(element, "change", function () { value(ko.bindingHandlers.selectedOptions.getSelectedValuesFromSelectNode(this)); });
        else if (allBindings._ko_property_writers && allBindings._ko_property_writers.value)
            ko.utils.registerEventHandler(element, "change", function () { allBindings._ko_property_writers.value(ko.bindingHandlers.selectedOptions.getSelectedValuesFromSelectNode(this)); });
    },
    update: function (element, value) {
        if (element.tagName != "SELECT")
            throw new Error("values binding applies only to SELECT elements");

        var newValue = ko.utils.unwrapObservable(value);
        if (newValue && typeof newValue.length == "number") {
            var nodes = element.childNodes;
            for (var i = 0, j = nodes.length; i < j; i++) {
                var node = nodes[i];
                if (node.tagName == "OPTION")
                    node.selected = ko.utils.arrayIndexOf(newValue, node.value) >= 0;
            }
        }
    }
};

ko.bindingHandlers.text = {
    update: function (element, value) {
        value = ko.utils.unwrapObservable(value);
        typeof element.innerText == "string" ? element.innerText = value
                                             : element.textContent = value;
    }
};

ko.bindingHandlers.css = {
    update: function (element, value) {
        value = value || {};
        for (var className in value) {
            if (typeof className == "string") {
                var shouldHaveClass = ko.utils.unwrapObservable(value[className]);
                ko.utils.toggleDomNodeCssClass(element, className, shouldHaveClass);
            }
        }
    }
};

// Binds a boolean observable to the checked state of an <input type="checkbox"/> element.
ko.bindingHandlers.checked = {
    init: function (element, value, allBindings) {
        var eventName = allBindings.valueUpdate || "click";
        if (ko.isWriteableObservable(value))
            ko.utils.registerEventHandler(element, eventName, function () { 
                value(!!this.checked); 
            });
        else if (allBindings._ko_property_writers && allBindings._ko_property_writers.value)
            ko.utils.registerEventHandler(element, eventName, function () {
                allBindings._ko_property_writers.value(!!this.checked);
            });
    },
    update: function (element, value) {
        element.checked = ko.utils.unwrapObservable(value);
    }
};