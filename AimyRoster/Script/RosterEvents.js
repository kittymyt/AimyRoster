var unsavedTasks = [];
var deleteTasks = [];
var newRef = [];
var filter;
var filterId;
var filterSource;

$(document).ready(function () {

    var start;
    var end;
    var editState = false;
    var notification;
    var reference;
    var refId;
    var columnDate;
    
    var siteNum = $("#sites").val();
    
    $(".glyphicon-plus").on({
        hover: function () {
            //$(this).css("color", "yellow");
            $(this).css('cursor', 'pointer');
            //$(this).animate({fontSize:"24px"},20);
            $('.myClass').css('cursor', 'pointer');
        },
	    mouseleave: function () {
	        //$(this).css("color", "#32C0C6");
	        $(this).css('cursor', 'auto');
	        //$(this).animate({fontSize:"14px"},20);
	}
    });

    var refData = new kendo.data.DataSource({
        batch: true,
        transport: {
            read: {
                url: "/Home/GetReference",
                dataType: "json",
                //data: siteNum,
                type: "GET"
            },
            create: {
                url: "/Home/SaveReference",
                dataType: "json",
                type: "POST",
                contentType: "application/json"
            },
            parameterMap: function (options, operation) {
                if (operation !== "read" && options.models) {
                    return JSON.stringify(newRef)
                }
            }
        },
        schema: {
            model: {
                id: "Id",
                fields: {
                    RefId: { type: "number" },
                    RefName: { type: "string" }
                }
            }
        },
        error: function (e) {
            console.log(e.errors)
        }
    });

    var ref = $("#reference").kendoDropDownList({
        filter: "contains",
        dataSource: refData,
        dataTextField: "RefName",
        dataValueField: "RefId",
        autoBind: false,
        change: refChange,
        optionLabel: " ",
        index: -1,
        noDataTemplate: $("#noDataTemplate").html()
    }).data("kendoDropDownList");

    function refChange() {
        var dataItem = this.dataItem(this.selectedIndex)
        reference = dataItem.RefName
        refId = dataItem.RefId
        newRef = {Id: refId, Name: reference}
    }

    //$("#comboFilter").change(function (e) {
    //    filter = $("#comboFilter").val()
    //});

    $("#comboFilter").kendoComboBox({
        placeholder: "By Name / Ref ....",
        dataTextField: "FltrName",
        dataValueField: "FltrId",
        filter: "contains",
        autoBind: false,
        minLength: 2,
        change: comboOnChange,
        //select: comboOnSelect,
        template: '<span class="k-state-default" style=""><h5>#: data.FltrDisplay # </h5></span>',
        dataSource: {
            serverFiltering: true,
            transport: {
                read: {
                    url: "/Home/FilterSearch",
                    data: function () {
                        return {
                            filterText: $("#comboFilter").data("kendoComboBox").input.val()
                        };
                    },
                }
            }
        }
    });

    function comboOnChange() {
        //combobox.options.filter = $("#comboFilter").val()
        //filter = $("#comboFilter").val()
        var dataItem = this.dataItem()
        if (dataItem !== undefined) {
            filterId = dataItem.FltrId
            filterSource = dataItem.FltrSource

            switch (filterSource) {
                case "Staff":
                    filterGrid(siteId, filterId)
                    return;
                case "Reference":
                    updategrid(siteId)
                    return;
            }
        }
        else {
            updategrid(siteId);
            filterId = ""
            filterSource = ""
        }
        console.log("Source = " + filterSource)
    };

    //function comboOnSelect(e) {
    //    //combobox.options.filter = $("#comboFilter").val()
    //    filter = e.dataItem.FltrId
    //    console.log(filter)
    //};

    $("body").unbind("click").on("click", ".glyphicon-plus", function () {

        var startTime = $('#startTime').val();
        if (!startTime)
            startTime = '8:00 AM';
        var finishTime = $('#finishTime').val();
        if (!finishTime)
            finishTime = '5:00 PM';

      

        //get the widget information
        var currentColumnIndex = $(this).closest("td").index();
        var selectedRow = $(this).closest('tr').find('div[class="add-roster-wrapper"]');
        var selectedCell = (selectedRow[currentColumnIndex]).id;
        var columnDate = $('th:eq(' + currentColumnIndex + ')').data("date");
        var selectStartDate = (columnDate.getFullYear() + "-" + (columnDate.getMonth() + 1) + "-" + columnDate.getDate() + " " + startTime);
        var selectEndDate = (columnDate.getFullYear() + "-" + (columnDate.getMonth() + 1) + "-" + columnDate.getDate() + " " + finishTime);
        var siteId = $('#sites').val();
        var staffId = $(this).closest("td").find(".staffTemplate").attr("data-value");
        var dataStaffId = "[data-staffid=" + staffId + "]";

        var existingHours = parseFloat($('div' + dataStaffId).text());
        var currentDate = new Date()
        var refWidget = reference == undefined ? null : reference.trim();

        var bookDetail = {
            SiteId: siteId,
            StaffId: staffId,
            StartDate: selectStartDate,
            EndDate: selectEndDate,
            RefId: refId
        };

        //if (!(columnDate > currentDate)) {
        //    notFutureDate()
        //    return
        //}

        var dataIndex = "[data-index=" + currentColumnIndex + "]";
        var dateHeader = $("#scheduler thead").find(dataIndex).data().date;

        if (reference == null || reference == "") {
            var refString = ""
        }
        else {
            var refString = reference
        }

        $.ajax({
            url: "/Home/ReadExistingTask",
            data: { optStaffId: staffId, optStartDate: selectStartDate, optEndDate: selectEndDate },
            datatype: "json",
            type: "GET",
            success: function (response) {
                var result = response;
                if (result == "") {
                    var overlapTask = conflictCheck(staffId, columnDate, selectStartDate, selectEndDate);
                        
                    if (overlapTask == true) {
                        //alert('Warning: Staff is already booked for selected date & time');
                        var bookedmsg = "Staff is already booked for selected date & time"
                        alreadyBooked(bookedmsg)
                    } else {
                        var div =
                            $("<div class='innerdiv' ><span class='planStart'>" + startTime + "</span> - <span class='planEnd'>" + finishTime + "</span>" + "<br>" + "<span class='ref'>" + refString + "</span> " + "<div class='glyphicon glyphicon-pencil remove-staff edit-Record'></div>" + "<div class='glyphicon glyphicon-remove'></div></div>");
                        var selectedDiv = $('#' + selectedCell);

                        //calculate the week time of a staff
                        var hourDiff = timeDiffcalculate(startTime, finishTime);

                        var newHours = parseFloat(existingHours + hourDiff).toFixed(2);
                        $("#scheduler tbody").find(dataStaffId).html(newHours);

                        var taskDay = weekNames[columnDate.getDay()]
                        addDailyTotals(taskDay, hourDiff)
                        refreshTotals();

                        selectedDiv.append(div);
                        unsavedTasks.push(bookDetail);

                        saveButtonDisplay();
                    }
                }
                else {
                    for (var i = 0; i < result.length; i++) {
                        var deleteIndex = $.inArray((result[i].Id).toFixed(), deleteTasks);
                        if (deleteIndex != -1) {
                            result.splice(deleteIndex, 1);
                        }
                    }
                    if (result.length > 0) {
                        //alert('Warning: Staff is already booked for selected date & time');
                        var bookedmsg = "Staff is already booked for selected date & time in " + response[0].SiteName
                        alreadyBooked(bookedmsg);
                    } else {
                        var div =
                               $("<div class='innerdiv'><span class='planStart'>" + startTime + "</span> - <span class='planEnd'>" + finishTime + "</span>" + "<br>" + "<span class='ref'>" + refString + "</span> " + "<div class='glyphicon glyphicon-pencil remove-staff edit-Record'></div>" + "<div class='glyphicon glyphicon-remove'></div></div>");
                        var selectedDiv = $('#' + selectedCell);

                        //calculate the week time of a staff
                        var hourDiff = timeDiffcalculate(startTime, finishTime);

                        var newHours = parseFloat(existingHours + hourDiff).toFixed(2);
                        $("#scheduler tbody").find(dataStaffId).html(newHours);

                        var taskDay = weekNames[columnDate.getDay()];
                        addDailyTotals(taskDay, hourDiff);
                        refreshTotals();

                        selectedDiv.append(div);
                        unsavedTasks.push(bookDetail);

                        saveButtonDisplay();
                    }
                    

                };
            }
        });
    });
   
    function conflictCheck(staffId, columnDate, startPoint, endPoint) {

        var a = unsavedTasks.some(function (search) {
            console.table(search)

            var arrStartDate = search.StartDate;
            var arrStartDateTime = new Date(arrStartDate);
            var arrDay = arrStartDateTime.getDate();
            var selectStartDateTime = new Date(startPoint);

            var arrEndDate = search.EndDate;
            var arrEndDateTime = new Date(arrEndDate);
            var selectEndDateTime = new Date(endPoint);

            return (
                     ((search.StaffId == staffId) && (arrDay == columnDate.getDate()))
                    && !((arrEndDateTime <= selectStartDateTime) || (selectEndDateTime <= arrStartDateTime))
                );
        });

        return a;
    };

    $(".glyphicon-remove").on({
        hover: function () {
            $(this).css('cursor', 'pointer');
        },
        mouseleave: function () {
            $(this).css('cursor', 'auto');
        }
	});


    $("body").on("click", ".glyphicon-remove", function (event) {

        var currentColumnIndex = $(this).closest("td").index();
        var siteId = $('#sites').val();
        var staffId = $(this).closest("td").find(".staffTemplate").attr("data-value");
        var dataStaffId = "[data-staffid=" + staffId + "]";
        var existingHours = parseFloat($('div' + dataStaffId).text());

        var startTime = $(this).siblings(".planStart").text();
        var finishTime = $(this).siblings(".planEnd").text();

        var columnDate = $('th:eq(' + currentColumnIndex + ')').data("date");
        var selectStartDate = (columnDate.getFullYear() + "-" + (columnDate.getMonth() + 1) + "-" + columnDate.getDate() + " " + startTime);
        var selectEndDate = (columnDate.getFullYear() + "-" + (columnDate.getMonth() + 1) + "-" + columnDate.getDate() + " " + finishTime);

        var bookDetail = {
            SiteId: siteId,
            StaffId: staffId,
            StartDate: selectStartDate,
            EndDate: selectEndDate,
            RefId: refId
        };

        //get the widget id so that we can delete it in database
        var widgetId = $(this).parent().attr("data-id");

        if (widgetId != null) {
            if ($.inArray(widgetId, deleteTasks) == -1) {
                deleteTasks.push(widgetId);
            }

            for (var k = 0; k < unsavedTasks.length; k++) {
                if (widgetId == unsavedTasks[k].Id) {
                    unsavedTasks.splice(k, 1);
                }
            }

            saveButtonDisplay();

        } else {
            for (var i = 0; i < unsavedTasks.length; i++) {
            if (bookDetail.SiteId == unsavedTasks[i].SiteId && bookDetail.StaffId == unsavedTasks[i].StaffId
                && bookDetail.StartDate == unsavedTasks[i].StartDate && bookDetail.EndDate == unsavedTasks[i].EndDate) {
                unsavedTasks.splice(i, 1);
                saveButtonDisplay();
            }
        }
    }

      
        var hourDiff = timeDiffcalculate(startTime, finishTime);
        var newHours = parseFloat(existingHours - hourDiff).toFixed(2);

        $("#scheduler tbody").find(dataStaffId).html(newHours);

        $(this).parent().remove();

        var taskDay = weekNames[columnDate.getDay()]
        minusDailyTotals(taskDay, hourDiff)
        refreshTotals();

    });

    $("body").on("click", ".edit-Record", function () {
        //set the background color of the selected widget
        var widget = $(this).parent();
        $(".innerdiv").css("background", "#32C0C6");
        widget.css("background-color", "coral");
        $("#cancelEdit").css("display", "block");

        $("#startTime").css("background", "steelblue");
        var dataId = $(this).parent().attr("data-id");



        var startTimePicker = $("#startTime").data("kendoTimePicker");
        var finishTimePicker = $("#finishTime").data("kendoTimePicker");
        //var editRef = $("#reference").data("kendoDropDownList");

        startTimePicker.value($(this).siblings(".planStart").text());
        console.log($(this).siblings(".planStart").text());


        var endTime = startTimePicker.value();
        endTime.setMinutes(endTime.getMinutes() + parseInt(interval.value()));
        end.min(endTime);

        console.log($(this).siblings(".planEnd").text());
        finishTimePicker.value($(this).siblings(".planEnd").text());

        //editRef.trigger("change");


        var editStart = $(this).siblings(".planStart");
        var editEnd = $(this).siblings(".planEnd");
        var editRef = $(this).siblings(".ref");

        var currentSiteId = $('#sites').val();
        var currentStaffId = $(this).parents().siblings(".staffTemplate").attr("data-value");
        var currentColumnIndex = $(this).closest("td").index();
        columnDate = $('th:eq(' + currentColumnIndex + ')').data("date");
        var originalStartDate = (columnDate.getFullYear() + "-" + (columnDate.getMonth() + 1) + "-" + columnDate.getDate() + " " + editStart.text());
        var originalEndDate = (columnDate.getFullYear() + "-" + (columnDate.getMonth() + 1) + "-" + columnDate.getDate() + " " + editEnd.text());
        

        var oldTimeDiff = timeDiffcalculate(editStart.text(), editEnd.text());
        var staffId = $(this).closest("td").find(".staffTemplate").attr("data-value");
        var dataStaffId = "[data-staffid=" + staffId + "]";
        var existingHours = parseFloat($('div' + dataStaffId).text());

        var originalBooking = {
            DataId: dataId,
            SiteId: currentSiteId,
            StaffId: currentStaffId,
            StartDate: originalStartDate,
            EndDate: originalEndDate,
            RefId: refId
        };

        //find the index of the unsave plans in the unsavedTasks
        //if (dataId == null) {
        for (var i = 0; i < unsavedTasks.length; i++) {
            if (originalBooking.SiteId == unsavedTasks[i].SiteId && originalBooking.StaffId == unsavedTasks[i].StaffId
                && originalBooking.StartDate == unsavedTasks[i].StartDate && originalBooking.EndDate == unsavedTasks[i].EndDate) {
                var index = i;
            }
        }
        // }

        editState = true;

        $("#editSaving").css("display", "none");

        $("#editSaving").unbind("click").click(function () {

            if ($("#startTime").data("kendoTimePicker").value() == null || $("#finishTime").data("kendoTimePicker").value() == null) {
                alert("Please input the time in right format");
            } else {
                var selectStartDate = (columnDate.getFullYear() + "-" + (columnDate.getMonth() + 1) + "-" + columnDate.getDate() + " " + $("#startTime").val());
                var selectEndDate = (columnDate.getFullYear() + "-" + (columnDate.getMonth() + 1) + "-" + columnDate.getDate() + " " + $("#finishTime").val());

                if (reference == null || reference == "") {
                    var refString = ""
                }
                else {
                    var refString = reference
                }

                var newTimeDiff = timeDiffcalculate($("#startTime").val(), $("#finishTime").val());


                if (dataId == null) {
                    $.ajax({
                        url: "/Home/ReadExistingTask",
                        data: { optStaffId: currentStaffId, optStartDate: selectStartDate, optEndDate: selectEndDate },
                        datatype: "json",
                        async: false,
                        type: "GET",
                        success: function (response) {
                            var result = response;
                            if (result == "") {
                                unsavedTasks.splice(index, 1);
                                var overlapTask = conflictCheck(currentStaffId, columnDate, selectStartDate, selectEndDate);

                                if (!overlapTask) {

                                    var previousBooking = {
                                        DataId: dataId,
                                        SiteId: currentSiteId,
                                        StaffId: currentStaffId,
                                        StartDate: selectStartDate,
                                        EndDate: selectEndDate,
                                        RefId: refId
                                    }

                                    editStart.text($("#startTime").val());
                                    editEnd.text($("#finishTime").val());
                                    editRef.text(refString);

                                    unsavedTasks.push(previousBooking);
                                    existingHours = existingHours - oldTimeDiff + newTimeDiff;

                                    var taskDay = weekNames[columnDate.getDay()];
                                    minusDailyTotals(taskDay, oldTimeDiff);
                                    addDailyTotals(taskDay, newTimeDiff);
                                    refreshTotals();

                                    $("#scheduler tbody").find(dataStaffId).html(existingHours.toFixed(2));

                                    $("#editSaving").css("display", "none");
                                    widget.css("background-color", "#32c0c6");
                                    $("#cancelEdit").css("display", "none");
                                    editState = false;
                                    saveButtonDisplay();
                                } else {
                                    alert('Warning: Staff is already booked for selected date & time');
                                    unsavedTasks.push(originalBooking);
                                    $("#editSaving").css("display", "none");
                                    $("#cancelEdit").css("display", "none");
                                    widget.css("background", "#32c0c6");
                                }
                            } else {

                                for (var i = 0; i < result.length; i++) {
                                    var deleteIndex = $.inArray((result[i].Id).toFixed(), deleteTasks);
                                    if (deleteIndex != -1) {
                                        result.splice(deleteIndex, 1);
                                    }
                                }

                                if (result.length > 0) {
                                    alert('Warning: Staff is already booked for selected date & time');
                                    $("#editSaving").css("display", "none");
                                    $("#cancelEdit").css("display", "none");
                                    widget.css("background", "#32c0c6");
                                } else {
                                    var overlapTask = conflictCheck(staffId, columnDate, selectStartDate, selectEndDate);

                                    if (overlapTask == true) {
                                        alert('Warning: Staff is already booked for selected date & time');
                                        $("#editSaving").css("display", "none");
                                        $("#cancelEdit").css("display", "none");
                                        widget.css("background", "#32c0c6");
                                    } else {

                                        var previousBooking = {
                                            DataId: dataId,
                                            SiteId: currentSiteId,
                                            StaffId: currentStaffId,
                                            StartDate: selectStartDate,
                                            EndDate: selectEndDate,
                                            RefId: refId
                                        }

                                        editStart.text($("#startTime").val());
                                        editEnd.text($("#finishTime").val());
                                        editRef.text(refString);

                                        unsavedTasks.push(previousBooking);
                                        existingHours = existingHours - oldTimeDiff + newTimeDiff;


                                        $("#scheduler tbody").find(dataStaffId).html(existingHours.toFixed(2));
                                        var taskDay = weekNames[columnDate.getDay()];
                                        minusDailyTotals(taskDay, oldTimeDiff);
                                        addDailyTotals(taskDay, newTimeDiff);
                                        refreshTotals();

                                        $("#editSaving").css("display", "none");
                                        $("#cancelEdit").css("display", "none");
                                        widget.css("background", "#32c0c6");
                                        editState = false;
                                        saveButtonDisplay();
                                    }
                                }
                            }
                        }
                    });
                } else {
                    $.ajax({
                        url: "/Home/EditRepeatCheck",
                        data: { optStaffId: currentStaffId, optStartDate: selectStartDate, optEndDate: selectEndDate, dataId: dataId },
                        datatype: "json",
                        async: false,
                        type: "GET",
                        success: function (response) {
                            var result = response;
                            if (result == "") {

                                var unsavedContainOrNot = unsavedTasks.some(function (search) {
                                    for (var i = 0; i < unsavedTasks.length; i++) {
                                        return search.Id == dataId;
                                    }
                                });

                                if (unsavedContainOrNot) {
                                    unsavedTasks.splice(index, 1);
                                }

                                var overlapTask = conflictCheck(currentStaffId, columnDate, selectStartDate, selectEndDate);

                                if (!overlapTask) {

                                    var editBookDetail = {
                                        Id: dataId,
                                        SiteId: currentSiteId,
                                        StaffId: currentStaffId,
                                        StartDate: selectStartDate,
                                        EndDate: selectEndDate,
                                        RefId: refId
                                    };

                                    editStart.text($("#startTime").val());
                                    editEnd.text($("#finishTime").val());
                                    editRef.text(refString);


                                    var deleteContainOrNot = deleteTasks.some(function (search) {
                                        console.log(search);
                                        return search == dataId;
                                    });


                                    unsavedTasks.push(editBookDetail);
                                    saveButtonDisplay();


                                    if (!deleteContainOrNot) {
                                        deleteTasks.push(dataId);
                                        saveButtonDisplay();
                                    }

                                    existingHours = existingHours - oldTimeDiff + newTimeDiff;
                                    $("#scheduler tbody").find(dataStaffId).html(existingHours.toFixed(2));
                                    var taskDay = weekNames[columnDate.getDay()];
                                    console.log("oldTimeDiff: " + oldTimeDiff + "newTimeDiff: " + newTimeDiff);
                                    minusDailyTotals(taskDay, oldTimeDiff);
                                    addDailyTotals(taskDay, newTimeDiff);
                                    refreshTotals();

                                    $("#editSaving").css("display", "none");
                                    $("#cancelEdit").css("display", "none");
                                    widget.css("background-color", "#32c0c6");
                                    editState = false;
                                    saveButtonDisplay();
                                } else {
                                    alert('Warning: Staff is already booked for selected date & time');
                                    $("#editSaving").css("display", "none");
                                    $("#cancelEdit").css("display", "none");
                                    widget.css("background", "#32c0c6");
                                }
                            } else {

                                for (var i = 0; i < result.length; i++) {
                                    var deleteIndex = $.inArray((result[i].Id).toFixed(), deleteTasks);
                                    if (deleteIndex != -1) {
                                        result.splice(deleteIndex, 1);
                                    }
                                }

                                if (result.length > 0) {
                                    alert('Warning: Staff is already booked for selected date & time');
                                    $("#editSaving").css("display", "none");
                                    $("#cancelEdit").css("display", "none");
                                    widget.css("background", "#32c0c6");
                                } else {
                                    var unsavedContainOrNot = unsavedTasks.some(function (search) {
                                        for (var i = 0; i < unsavedTasks.length; i++) {
                                            return search.DataId == dataId;
                                        }
                                    });

                                    if (unsavedContainOrNot) {
                                        unsavedTasks.splice(index, 1);
                                    }

                                    var overlapTask = conflictCheck(currentStaffId, columnDate, selectStartDate, selectEndDate);

                                    if (!overlapTask) {

                                        var editBookDetail = {
                                            Id: dataId,
                                            SiteId: currentSiteId,
                                            StaffId: currentStaffId,
                                            StartDate: selectStartDate,
                                            EndDate: selectEndDate,
                                            RefId: refId
                                        };

                                        editStart.text($("#startTime").val());
                                        editEnd.text($("#finishTime").val());
                                        editRef.text(refString);


                                        var deleteContainOrNot = deleteTasks.some(function (search) {
                                            console.log(search);
                                            return search == dataId;
                                        });


                                        unsavedTasks.push(editBookDetail);
                                        saveButtonDisplay();


                                        if (!deleteContainOrNot) {
                                            deleteTasks.push(dataId);
                                            saveButtonDisplay();
                                        }

                                        existingHours = existingHours - oldTimeDiff + newTimeDiff;
                                        $("#scheduler tbody").find(dataStaffId).html(existingHours.toFixed(2));
                                        var taskDay = weekNames[columnDate.getDay()];
                                        minusDailyTotals(taskDay, oldTimeDiff);
                                        addDailyTotals(taskDay, newTimeDiff);
                                        refreshTotals();

                                        $("#editSaving").css("display", "none");
                                        $("#cancelEdit").css("display", "none");
                                        widget.css("background", "#32c0c6");
                                        editState = false;
                                        saveButtonDisplay();

                                    }
                                }
                            }
                        }
                    });
                }
            }


        });

    });

    $("#startTime,#finishTime,#reference").on('change', function () {
        if (editState) {
            $("#startTime").css("background", "");
            $("#editSaving").css("display", "block");
        }
        editState = false;
    });

    $("#cancelEdit").click(function () {
        $(this).css("display", "none");
        $("#startTime").css("background", "");
        $(".innerdiv").css("background-color", "#32c0c6");
        $("#editSaving").css("display", "none");
        editState = false;
    });

    //init start timepicker
    var intervalData = [
           { text: "15 minutes", value: 15 },
           { text: "30 minutes", value: 30 },
           { text: "45 minutes", value: 45 },
           { text: "1 hour", value: 60 }

    ];

    // create DropDownList from input HTML element
    var interval = $("#timeinterval").kendoDropDownList({
        dataTextField: "text",
        dataValueField: "value",
        dataSource: intervalData,
        index: 0,
        change: changeInterval
    }).data("kendoDropDownList");


    drawTimePicker();

    $("body").on("mouseenter", ".innerdiv", function () {
        $(this).css("font-size", "11px");
        $(this).children(".edit-Record").css({ "display": "inline", "font-size": "14px" });
        $(this).children(".glyphicon-remove").css({ "display": "inline", "font-size": "14px" });
    });

    $("body").on("mouseleave", ".innerdiv", function () {
        $(this).css("font-size", "14px");
        $(this).children(".edit-Record").css({ "display": "none" });
        $(this).children(".glyphicon-remove").css({ "display": "none" });
    });

    function startChange() {
        //debugger;
        var startTime = start.value();
        var endTime = end.value();       

        if (startTime) {
            endTime = start.value();

            endTime.setMinutes(endTime.getMinutes()+parseInt(interval.value()));
            end.min(endTime);
            end.value(endTime);
        }
    }



    function changeInterval() {
        $("#startTime").val('');
        $("#finishTime").val('');
        drawTimePicker();
        startChange();      
    }

    
    
    //save the object array back to database
    //$("#saveButton").click(function(e){
    //    saveChanges();
    //});

    var save = $("#saveButton").kendoButton({
        click: function () {
            saveChanges();
            
        }
    });

    function drawTimePicker() {
        //change the interval of timepicker
        start = $("#startTime").kendoTimePicker({
            interval: interval.value(),
            change: startChange
        }).data("kendoTimePicker");

        end = $("#finishTime").kendoTimePicker({
            interval: interval.value()
        }).data("kendoTimePicker");

        //define min/max range
        start.min("8:00 AM");
        start.max("7:00 PM");

        //define min/max range
        end.min("8:00 AM");
        end.max("8:00 PM");
    }

});

//run the save process: add and remove widgets
function saveChanges() {
    //var ask = confirm("Want to save the changes?");
    //if (ask == true) {
    myconfirm("Do you want to save changes to current week?").then(function () {
        if (unsavedTasks.length > 0 && unsavedTasks != null) {
            $.ajax({
                url: "/Home/SaveBooking",
                datatype: "json",
                data: { bookDetails: unsavedTasks },
                type: "POST",
            });
        }
        if (deleteTasks.length > 0 && deleteTasks!=null) {
            $.ajax({
                url: "/Home/DeleteBooking",
                datatype: "json",
                data: { deleteDetails: deleteTasks },
                type: "POST",
            });
        }
        unsavedTasks = [];
        deleteTasks = [];
        //alert("Saved Successfully");
        //}
        saveSuccess()
        saveButtonDisplay();
    }, function () {
        saveCancel()
        unsavedTasks = [];
        deleteTasks = [];
        saveButtonDisplay();
    });
    
}

function saveSuccess() {
    notification.show({
        message: "Save Successful"
    }, "upload-success");
}

function saveCancel() {
    notification.show({
        message: "Saving Cancelled"
    }, "error");
}

function myconfirm(content) {
    return $("<div></div>").kendoConfirm({
        title: "Save Changes",
        content: content
    }).data("kendoConfirm").open().result;
}

$(document).ready(function () {
    notification = $("#notification").kendoNotification({
        position: {
            //pinned: true,
            top: 5,
            right: 30
        },
        autoHideAfter: 4000,
        stacking: "down",
        templates: [{
            type: "info",
            template: $("#bookedTemplate").html()
        }, {
            type: "error",
            template: $("#cancelTemplate").html()
        }, {
            type: "upload-success",
            template: $("#successTemplate").html()
        }]


    }).data("kendoNotification");

});

$(document).one("kendo:pageUnload", function () { if (notification) { notification.hide(); } });

function alreadyBooked(msg) {
    notification.show({
        title: "Already Booked",
        message: msg
    }, "info");
}

function notFutureDate() {
    notification.show({
        message: "Scheduling only allowed for future dates"
    }, "error");
};

function addNew(widgetId, value) {
    var widget = $("#" + widgetId).getKendoDropDownList();
    var dataSource = widget.dataSource;
    
    refConfirm("Do you want to add Reference?").then(function () {
        dataSource.add({
            //RefId: 0,
            RefName: value,
            //SiteId: siteNum
        });

        newRef = {RefName: value}
        
        dataSource.one("sync", function () {
            widget.select(dataSource.view().length - 1);
        });

        dataSource.sync();
        var newList = $("#reference").data("kendoDropDownList").dataSource.read();
        //console.log($("#reference").data("kendoDropDownList"))
    })
};

function refConfirm(content) {
    return $("<div></div>").kendoConfirm({
        title: "Save Reference",
        content: content
    }).data("kendoConfirm").open().result;
}

/**
    calculate the hour difference between the start-end time
*/
function timeDiffcalculate(startTime, finishTime) {

    var time1 = startTime.split(':'), time2 = finishTime.split(':');
    var hours1 = parseInt(time1[0], 10),
        hours2 = parseInt(time2[0], 10),
        mins1 = parseInt(time1[1], 10),
        mins2 = parseInt(time2[1], 10);
    var hours = hours2 - hours1, mins = 0;

    // get hours
    if (hours < 0) hours = 12 + hours;

    // get minutes
    if (mins2 >= mins1) {
        mins = mins2 - mins1;
    }
    else {
        mins = (mins2 + 60) - mins1;
        hours--;
    }

    // convert to fraction of 60
    mins = mins / 60;

    hours += mins;
    var hourDiff = parseFloat(hours.toFixed(2));
    return hourDiff;
}

function saveButtonDisplay() {
    if (unsavedTasks.length > 0 || deleteTasks.length > 0) {
        $("#saveButton").css("display", "block");
    } else {
        $("#saveButton").css("display", "none");
    }
}

function filterGrid(siteId, filterStaffId) {

    if (unsavedTasks.length > 0 || deleteTasks.length > 0) {
        saveChanges();
    }

    gridData = new kendo.data.DataSource({
        transport: {
            read: function (options) {
                $.ajax({
                    url: "/Home/FilterByStaff",
                    data: { getSiteId: siteId, getStaffId: filterStaffId },
                    dataType: "json",
                    success: function (response) {
                        var result = response;
                        result.forEach(function (value) {
                            value.Mon = $("th:eq(0)").html().replace(/\s+/g, '');
                            value.Tue = $("th:eq(1)").html().replace(/\s+/g, '');
                            value.Wed = $("th:eq(2)").html().replace(/\s+/g, '');
                            value.Thu = $("th:eq(3)").html().replace(/\s+/g, '');
                            value.Fri = $("th:eq(4)").html().replace(/\s+/g, '');
                            value.Sat = $("th:eq(5)").html().replace(/\s+/g, '');
                            value.Sun = $("th:eq(6)").html().replace(/\s+/g, '');
                        });
                        options.success(result)
                    }
                })
            }
        },
    });

    var startDate = $('th:eq(0)').data("date");
    var readStartDate = (startDate.getFullYear() + "-" + (startDate.getMonth() + 1) + "-" + startDate.getDate());
    var endDate = $('th:eq(6)').data("date");
    var readEndDate = (endDate.getFullYear() + "-" + (endDate.getMonth() + 1) + "-" + (endDate.getDate() + 1));

    initializeTotals()
    var newgrid = $("#scheduler").data("kendoGrid");
    newgrid.setDataSource(gridData);
    LoadTasks(readStartDate, readEndDate);
};

function filterByReference(readStartDate, readEndDate, filterReference) {

    if (unsavedTasks.length > 0 || deleteTasks.length > 0) {
        saveChanges();
    }

    $.ajax({
        url: "/Home/FilterByRef",
        data: { weekStart: readStartDate, weekEnd: readEndDate, getReference: filterReference },
        datatype: "json",
        type: "GET",
        success: function (response) {
            $.each(response, function (key, value) {

                var targetStartDate = new Date(value.StartDate.slice(0, -2));
                var targetcellStartDate = weekNames[targetStartDate.getDay()] + targetStartDate.getDate() + monthNames[targetStartDate.getMonth()];

                var readStartTime = (value.StartDate).substr((value.StartDate).length - 7);
                var targetStartTime = [readStartTime.slice(0, 5), " ", readStartTime.slice(5)].join('').trim();

                var readEndTime = (value.EndDate).substr((value.EndDate).length - 7);
                var targetEndTime = [readEndTime.slice(0, 5), " ", readEndTime.slice(5)].join('').trim();

                if (value.RefName == null) {
                    var refDBString = ""
                }
                else {
                    var refDBString = " - " + value.RefName
                }

                var targetcell = "" + value.SiteId + value.StaffId + targetcellStartDate;

                var targetDiv = $('#cell_' + targetcell);
                var columnNum = targetDiv.index();

                var div =
                  $("<div class='innerdiv' data-id='" + value.Id + "' col='" + columnNum + "'>" + targetStartTime.replace(/^(?:00:)?0?/, '') + " - " + targetEndTime.replace(/^(?:00:)?0?/, '') + refDBString + " " + "<span class='glyphicon glyphicon-remove'></div>");
                if (targetDiv !== undefined) {
                    targetDiv.append(div);
                }

                //calculate the widget time and add it to the week time
                var dataStaffId = "[data-staffid=" + value.StaffId + "]";
                var existingHours = parseFloat($('div' + dataStaffId).text());

                var hourDiff = timeDiffcalculate(targetStartTime, targetEndTime);

                var taskDay = weekNames[targetStartDate.getDay()]
                if (columnNum > -1) {
                    var newHours = parseFloat(existingHours + hourDiff).toFixed(2);
                    $("#scheduler tbody").find(dataStaffId).html(newHours);
                    addDailyTotals(taskDay, hourDiff)
                    refreshTotals();
                }
            });
        }
    })
};