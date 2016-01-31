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

// Update graphs method
function updateGraphs(cpuind,cpus,graphls){
    // Link each graph
    for (var j=0; j<graphls.length; j++){
        // Fill in content of graph object
        var vv = clone(graphls[j]);
        vv.data = cpus[cpuind].graphs[j];

        // Update each graph
        MG.data_graphic(vv);
    }
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
    var cpus = []; // Array of CPU names and properties (along with GPU data)
    var socketurl = window.location.href.split(/[\/]/)[2]; // Get generic socket URL
    var socket = io.connect("http://" + socketurl) // Socket connection
    var cpulist = document.getElementById('cpulist'); // HTML CPU list
    var pcw = document.getElementById('page-content-wrapper'); // Top page
    var maxdata = 200; // Maximum number of datapoints
    var curcpu = null; // Current cpu name
    var graphls = []; // Array of graph descriptors

    // Request CPU information
    socket.on('connect', function(data){
        socket.emit('cpureq', {}); // Empty query
    });

    // Handle view change on click
    function cpuSelect(str){
        // Update the top row with the CPU name
        //var html = '<a id="menu-toggle" style="position: absolute; left: 0px; top: 50%; transform: translateY(-50%);" class="btn btn-default"></a>'
        html='';
        html += '<h1>' + str + '</h1>';
        pcw.innerHTML = html;

        // Request GPU information
        socket.emit('gpureq', str); // Send cpuname
        
        // Request the current graphs
        //socket.emit('cpusel', str);  // Send cpuname
    }

    // Handle CPU list response
    socket.on('cpuresp', function(data){
        // Prevent redundant calls (should check for contents)
        if (data.cpus && (cpus.length != data.cpus.length)){
            cpus = data.cpus; // Add cpus to the list
            graphls = data.graph; // Add graph list
            console.log(cpus);
            console.log(graphls);

            // Loop through and add each CPU to the sidebar
            var html='<br/><br/>';
            for (var i=0; i<cpus.length; i++){
                // Extract information from the current CPU
                var cname = (cpus[i].name ? cpus[i].name : "UNKNOWN CPU");
                var linkname = "#" + (cpus[i].href ? cpus[i].href : cname);
                var icon = (cpus[i].icon ? cpus[i].icon : "computer-xxl.png");

                // Concatenate rich HTML
                html += '<li id="' + cname + '"><a class="cpuitem" href=' + linkname + '><img src="images/' + icon + '" width=30, style="margin: 0px 15px 0px 0px;"/>' + cname + '</a></li>';

                // Add graph attribute to each CPU element
                cpus[i].graphs = [];
                for (var j=0; j<graphls.length; j++){
                    cpus[i].graphs.push([]); // Add empty array for each graph
                }
            }

            // Apply HTML to element
            cpulist.innerHTML = html;

            // Add jQuery click function
            $('.sidebar-nav li').click(function(e){
                //console.log('Clicked!');
                console.log(e.currentTarget.id);
                e.preventDefault();
                $('.cpuhighlight').removeClass('cpuhighlight');
                //$('.cpuitem').removeClass('txthighlight')
                //$cpuitems.removeClass(classhl);
                $(this).addClass('cpuhighlight');

                // Change the view
                cpuSelect(e.currentTarget.id);
            });

            // Add text
            $('.cpuitem').click(function(e){
                e.preventDefault();
                $('.cpuitem').removeClass('txthighlight');
                $(this).addClass('txthighlight');
            });
        }
    });

    // Handle GPU content response
    socket.on('gpuresp', function(data){
        console.log('Got GPU response!');
        console.log(data);

        // Get CPU cross-reference index
        var cpuind = null;
        for (var i=0; i<cpus.length; i++){
            if (cpus[i].name === data.cpuid){
                cpuind = i;
                break;
            }
        }
        console.log(cpuind);

        // Exit immediately if CPU ID is not given
        if (cpuind === null){
            console.log('CPU ID was not found!');
            return;
        }

        //console.log(curcpu);
        //console.log(cpus[cpuind].name);
        
        // Set current CPU
        curcpu = cpus[cpuind].name;

        // Add GPU information to the list of GPUs
        //var html = '<div class="row placeholders" style="height: 259px; overflow-y: scroll;">';
        var html = '<div class="row placeholders" style="height: 259px; overflow-y: auto;">';
        for (var i=0; i<data.gpus.length; i++){
            // Render test object to get style
            var cur = pcw.innerHTML; // Save copy of current HTMl
            pcw.innerHTML += '<div class="mg-line' + (i+1) + '-color" id="__test-item__"></div>';
            var styColor = getStyle(document.getElementById('__test-item__'), 'fill');
            pcw.innerHTML = cur; // Reset HTML

            // Get important variables
            var gname = (data.gpus[i].name ? data.gpus[i].name : 'UNKNOWN GPU');
            var gicon = (data.gpus[i].icon ? data.gpus[i].icon : 'default_gpu.png');
            var gstatus = (data.gpus[i].status ? data.gpus[i].status : "unknown");

            // Construct the HTML
            html += '<div class="col-md-3 col-sm-6 placeholder" style="text-align: center;">';
            html += '<img src="images/gpus/' + gicon + '" width="200" height="200" class="img-fluid" alt="Generic placeholder thumbnail">';
            //html += '<h4>' + gname + '</h4>';
            html += '<h4>';
            //html += '<svg height="14" width="15" style="display: inline; margin-right: 8px;"><circle cx="7" cy="7" r="7" fill="';
            html += '<svg height="15" width="16" style="display: inline; margin-right: 8px;"><circle cx="7" cy="8" r="7" fill="';
            html += styColor;
            html += '"></circle></svg>' + gname;
            html += '</h4>';
            html += '<span class="text-muted">' + gstatus + '</span>';
            html += '</div>';

            // Add GPU to list
            var g1 = {};
            g1.name = gname;
            g1.icon = gicon;
            g1.status = gstatus;
            //g1.data = [];

            // Add GPU list to the global tracker
            if (typeof cpus[cpuind].gpu  == 'undefined'){
                cpus[cpuind].gpu = [];
            }
            //if ( typeof cpus[cpuind].gpu[i] == 'undefined'){
            //    cpus[cpuind].gpu[i] = g1;
            //}
            //else{
            //    // Only update non-volatile data
            //    cpus[cpuind].gpu[i].name = gname;
            //    cpus[cpuind].gpu[i].icon = gicon;
            //    cpus[cpuind].gpu[i].status = gstatus;
            //}
            cpus[cpuind].gpu[i] = g1;
        }
        html += '</div><hr><div class="row row-centered" id="GPU-content"></div>';
        //html += '</div><hr><div class="row placeholder row-centered" id="GPU-content"></div>';

        // Add the HTML to the current section
        pcw.innerHTML += html;

        // Update graphs
        createGraphs(cpuind,cpus,graphls);
    });

    // Handle GPU data response
    socket.on('gpudata', function(data){
        //console.log(data);

        // Add contents of GPU data packet to the corresponding CPU array
        if (typeof data.data != 'undefined'){
            // Find CPU index
            var cpuind = null
            for (var i=0; i<cpus.length; i++){
                if (cpus[i].name === data.cpuname){
                    cpuind = i;
                    break;
                }
            }
            //console.log('CPUIND: ' + cpuind);
            //console.log(JSON.stringify(data.data));
            //console.log(data.data.length);

            // Add the data to the CPU's GPU data array
            if (cpuind != null){
                // Pack data from JSON array into graphs
                for (var j=0; j<data.data.length; j++){
                    //console.log("J: " + j);
                    //console.log(JSON.stringify(data.data[j]));


                    // Convert X data to time
                    var pform = clone(data.data[j]);
                    for (var g=0; g<pform.length; g++){
                        // Check for array continuity
                        if (typeof cpus[cpuind].graphs[j][g] == 'undefined'){
                            cpus[cpuind].graphs[j][g] = []; // Add empty GPU array to current graph
                        }

                        // Loop through all packets
                        for (var k=0; k<pform[g].length; k++){
                            pform[g][k][graphls[j].x_accessor] = new Date(pform[g][k][graphls[j].x_accessor]);

                            // Add the data packet in a fixed-size queue fashion
                            if (cpus[cpuind].graphs[j].length >= maxdata){
                                cpus[cpuind].graphs[j][g].shift(); // Shift data to left to remove first element
                            }
                            cpus[cpuind].graphs[j][g].push(pform[g][k]);
                        }
                    }

                    // Add data to current graph
                    //cpus[cpuind].graphs[j].push(pform);

                    //console.log('J: ' + j);
                    //console.log(pform);

                    // Loop through all GPUs
                    //for (var g=0; g<data.data[j].length; g++){
                    //    if (typeof cpus[cpuind].graphs[j][g] == 'undefined'){
                    //        cpus[cpuind].graphs[j][g] = []; // Add empty data array
                    //    }

                        // Add new data in a fixed-size queue fashion
                    //    if (cpus[cpuind].graphs[j][g].length >= maxdata){
                    //        cpus[cpuind].graphs[j][g].shift(); // Shift data to left to remove first element
                    //    }

                        // Convert X data to time
                    //    var pform = data.data[j][g];
                    //    pform[graphls[j].x_accessor] = new Date(pform[graphls[j].x_accessor]);
                    //    //cpus[cpuind].graphs[j][g].push(data.data[j][g]);
                    //    cpus[cpuind].graphs[j][g].push(pform);
                    //}
                }
                //console.log(cpus[cpuind]);

                // Add data to graphs
                //console.log(cpus[cpuind]);
                if (cpus[cpuind].name === curcpu){
                    updateGraphs(cpuind,cpus,graphls);
                }
            }
        }
    });
};

// JQuery set properties after load
//$(document).ready(function(){
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
//});
