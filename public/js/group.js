// Global clone function
function clone(obj){
    if (obj == null || typeof obj != 'object'){
        return obj;
    }
    else {
        var copy = obj.constructor();
        for (var attr in obj){
            if (obj.hasOwnProperty(attr)){
                copy[attr] = obj[attr];
            }
        }
        return copy;
    }
}

// Get style method
function getStyle(oElm, css3Prop){
    var strValue = "";

    if(window.getComputedStyle){
        strValue = getComputedStyle(oElm).getPropertyValue(css3Prop);
    }
    //IE
    else if (oElm.currentStyle){
        try {
            strValue = oElm.currentStyle[css3Prop];
        }
        catch (e){}
    }

    return strValue;
}

// Creates HTML to display graphs
function createGraphs(cpuind,cpus,graphls){
    // Set local variables
    var gcont = document.getElementById('GPU-content');
    var html = '';

    // Construct each HTML Graph
    for (var j=0; j<graphls.length; j++){
        var tgt = graphls[j].target;
        //html += '<div class="col-lg-6 col-md-12 col-centered col-fixed"><div class="center-block" id="' + tgt.slice(1) + '"></div></div>';
        //html += '<div class="col-lg-6 col-md-12 col-centered col-fixed" id="' + tgt.slice(1) + '"></div>';
        //html += '<div class="col-lg-6 col-xs-12 col-centered col-fixed" id="' + tgt.slice(1) + '"></div>';
        html += '<div class="col-lg-6 col-xs-12 col-fixed"><div class="col-centered" id="' + tgt.slice(1) + '"></div></div>';
    }

    // Add all of the graphs to the overall HTML
    gcont.innerHTML = html;

    // Update the graphs with current data
    updateGraphs(cpuind,cpus,graphls);
}

// Wait for the window to load
window.onload = function() {
    // Variable declarations
    //var socketurl = window.location.href.split(/[\/]/)[2]; // Get generic socket URL
    //var socket = io.connect("http://" + socketurl) // Socket connection

    // Request 
}

// JQuery set properties after load
$(document).ready(function(){
    //console.log('Ready!');
    //var classhl = 'cpuhighlight';
    // Catch click event on all sidebar items
    //$('.sidebar-nav li').click(function(e){
        //console.log('Clicked!');
        //e.preventDefault();
        //$('.cpuhighlight').removeClass('cpuhighlight');
        //$cpuitems.removeClass(classhl);
        //$(this).addClass('cpuhighlight');
    //});
});
