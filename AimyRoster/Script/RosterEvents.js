var unsavedTasks = [];
var deleteTasks = [];

$(document).ready(function () {

    var start;
    var end;
    
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

    

    $("body").on("click", ".glyphicon-plus", function () {

        var startTime = $('#startTime').val();
        if (!startTime)
            startTime = '8:00 AM';
        var finishTime = $('#finishTime').val();
        if (!finishTime)
            finishTime = '05:00 PM';

      

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

        var bookDetail = {
            SiteId: siteId,
            StaffId: staffId,
            StartDate: selectStartDate,
            EndDate: selectEndDate,
        };


        var dataIndex = "[data-index=" + currentColumnIndex + "]";
        var dateHeader = $("#scheduler thead").find(dataIndex).data().date;


        $.ajax({
            url: "/Home/ReadExistingTask",
            data: { optStaffId: staffId, optStartDate: selectStartDate, optEndDate: selectEndDate },
            datatype: "json",
            type: "GET",
            success: function (response) {
                var result = response;
                if (result == "") {
                    var overlapTask = unsavedTasks.some(function (search) {
                        console.table(search)

                        var arrStartDate = search.StartDate;
                        //var splitArrStartDate = arrStartDate.split(' ', 3);
                        //var arrDay = splitArrStartDate[0].slice(-2);
                        var arrStartDateTime = new Date(arrStartDate);
                        var arrDay = arrStartDateTime.getDate();
                        var selectStartDateTime = new Date(selectStartDate);

                        var arrEndDate = search.EndDate;
                        var arrEndDateTime = new Date(arrEndDate);
                        var selectEndDateTime = new Date(selectEndDate);

                        return (
                                 ((search.StaffId == staffId) && (arrDay == columnDate.getDate()))
                                && !((arrEndDateTime <= selectStartDateTime) || (selectEndDateTime <= arrStartDateTime))
                            )
                    });
                    if (overlapTask == true) {
                        alert('Warning: Staff is already booked for selected date & time');
                    } else {
                        var div =
                            $("<div class='innerdiv'>" + startTime + " - " + finishTime + "<span class='glyphicon glyphicon-remove'></div>");
                        var selectedDiv = $('#' + selectedCell);

                        //calculate the week time of a staff
                        var hourDiff = timeDiffcalculate(startTime, finishTime);

                        var newHours = parseFloat(existingHours + hourDiff).toFixed(2);
                        $("#scheduler tbody").find(dataStaffId).html(newHours);

                        selectedDiv.append(div);
                        unsavedTasks.push(bookDetail);
                    }
                }
                else {
                    alert('Warning: Staff is already booked for selected date & time');
                };
            }
        });
    });
   

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

        var hoursArray = $(this).parent().text().split(" - ");

        var startTime = hoursArray[0];
        var finishTime = hoursArray[1];

        var columnDate = $('th:eq(' + currentColumnIndex + ')').data("date");
        var selectStartDate = (columnDate.getFullYear() + "-" + (columnDate.getMonth() + 1) + "-" + columnDate.getDate() + " " + startTime);
        var selectEndDate = (columnDate.getFullYear() + "-" + (columnDate.getMonth() + 1) + "-" + columnDate.getDate() + " " + finishTime);

        var bookDetail = {
            SiteId: siteId,
            StaffId: staffId,
            StartDate: selectStartDate,
            EndDate: selectEndDate,
        };

        //get the widget id so that we can delete it in database
        var widgetId = $(this).parent().attr("data-id");

        if (widgetId != null)
        {
            deleteTasks.push(widgetId);
        } else {
            for(var i =0;i<unsavedTasks.length;i++)
            {
                if(bookDetail.SiteId == unsavedTasks[i].SiteId && bookDetail.StaffId == unsavedTasks[i].StaffId 
                    && bookDetail.StartDate == unsavedTasks[i].StartDate && bookDetail.EndDate == unsavedTasks[i].EndDate)
                {
                    unsavedTasks.splice(i, 1);
                }
            }
        }

      
        var hourDiff = timeDiffcalculate(startTime, finishTime);
        var newHours = parseFloat(existingHours - hourDiff).toFixed(2);

        $("#scheduler tbody").find(dataStaffId).html(newHours);

        $(this).parent().remove();        

    });

    
    // AMOR CHANGES
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

    var refData = [
           { RefId: 1, RefName: "BSC" },
           { RefId: 2, RefName: "ASC" },
           { RefId: 3, RefName: "BBB" }
    ];

    var ref = $("#reference").kendoDropDownList({
        filter: "contains",
        //dataSource: {
        //    transport: {
        //        read: {
        //            url: "/Home/GetReference",
        //            dataType: "json",
        //            type: "GET"
        //        }
        //    }
        //},
        dataSource: refData,
        dataTextField: "RefName",
        dataValueField: "RefId",
        autoBind: false,
        //change: refChange,
    }).data("kendoDropDownList");

    drawTimePicker();

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
    $("#saveButton").click(function(e){
        saveChanges();
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
    var ask = confirm("Want to save the changes?");
    if (ask == true) {
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
        alert("Saved Successfully");
    }
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