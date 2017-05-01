var siteId;
var gridData;
var monTotalHrs = 0;
var tueTotalHrs = 0;
var wedTotalHrs = 0;
var thuTotalHrs = 0;
var friTotalHrs = 0;
var satTotalHrs = 0;
var sunTotalHrs = 0;

var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June",
          "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
];

var weekNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


$(function () {
    
    $("#sites").kendoDropDownList({
        filter: "contains",
        dataSource: {
            transport: {
                read: {
                    url: "/Home/ReadSite",
                    dataType: "json"
                }
            }
        },
        dataTextField: "Name",
        dataValueField: "Id",
        autoBind: false,
        change: onSelect,
        //optionLabel: "-Select Site-",
        index: -1
    }).data("kendoDropDownList");

    

    function onSelect() {
        siteId = this.value();

        gridData = new kendo.data.DataSource({
            transport: {
                read: function (options) {

                    $.ajax({
                        url: "/Home/GetStaff",
                        data: { getSiteId: siteId },
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
        endDate.setDate(endDate.getDate() + 1);
        var readEndDate = (endDate.getFullYear() + "-" + (endDate.getMonth() + 1) + "-" + (endDate.getDate()));

        initializeTotals();
        var newgrid = $("#scheduler").data("kendoGrid");
        newgrid.setDataSource(gridData);
        LoadTasks(readStartDate, readEndDate);

        $("#saveButton").css("display", "none");
    }

    $("#startTime").kendoTimePicker();
    $("#finishTime").kendoTimePicker();


    $("#scheduler").kendoGrid({
        //height: 500,
        rowTemplate: kendo.template($("#template").html()),
        columns: [
            { field: "Mon", footerTemplate: "Hrs: <span id='monTotalHrs'>#=monTotalHrs#</span>" },
            { field: "Tue", footerTemplate: "Hrs: <span id='tueTotalHrs'>#=tueTotalHrs#</span>" },
            { field: "Wed", footerTemplate: "Hrs: <span id='wedTotalHrs'>#=wedTotalHrs#</span>" },
            { field: "Thu", footerTemplate: "Hrs: <span id='thuTotalHrs'>#=thuTotalHrs#</span>" },
            { field: "Fri", footerTemplate: "Hrs: <span id='friTotalHrs'>#=friTotalHrs#</span>" },
            { field: "Sat", footerTemplate: "Hrs: <span id='satTotalHrs'>#=satTotalHrs#</span>" },
            { field: "Sun", footerTemplate: "Hrs: <span id='sunTotalHrs'>#=sunTotalHrs#</span>" },
        ],
        editable: false,
        scrollable: false,
        //resizeable: false,
        noRecords: {
            template: "Please select a site."
        },
        
    });

})


function LoadTasks(readStartDate,readEndDate) {

    if (unsavedTasks.length > 0 || deleteTasks.length > 0) {
        saveChanges();
    }

    $.ajax({
        url: "/Home/ReadTask",
        data: { weekStart: readStartDate, weekEnd: readEndDate },
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
                    var refDBString = value.RefName
                }

                var targetcell = "" + value.SiteId + value.StaffId + targetcellStartDate;

                var targetDiv = $('#cell_' + targetcell);
                var columnNum = targetDiv.index();

                var div =
                  $("<div class='innerdiv' data-id='" + value.Id + "' col='" + columnNum + "'><span class='planStart'>"
                    + targetStartTime.replace(/^(?:00:)?0?/, '') + "</span> - <span class='planEnd'>"
                    + targetEndTime.replace(/^(?:00:)?0?/, '') + "</span>"
                    + "<br>" + "<span class='ref'>" + refDBString + "</span>"
                    + " <div class='glyphicon glyphicon-pencil remove-staff edit-Record'></div>"
                    + "<div class='glyphicon glyphicon-remove'></div>" + "</div>");
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

function addDailyTotals(taskDay, hourDiff) {
    switch (taskDay) {
        case "Mon":
            monTotalHrs = monTotalHrs + hourDiff;
            return;
        case "Tue":
            tueTotalHrs = tueTotalHrs + hourDiff;
            return;
        case "Wed":
            wedTotalHrs = wedTotalHrs + hourDiff;
            return;
        case "Thu":
            thuTotalHrs = thuTotalHrs + hourDiff;
            return;
        case "Fri":
            friTotalHrs = friTotalHrs + hourDiff;
            return;
        case "Sat":
            satTotalHrs = satTotalHrs + hourDiff;
            return;
        case "Sun":
            sunTotalHrs = sunTotalHrs + hourDiff;
            return;
    };
};

function refreshTotals() {
    $("#monTotalHrs").text(monTotalHrs.toFixed(2));
    $("#tueTotalHrs").text(tueTotalHrs.toFixed(2));
    $("#wedTotalHrs").text(wedTotalHrs.toFixed(2));
    $("#thuTotalHrs").text(thuTotalHrs.toFixed(2));
    $("#friTotalHrs").text(friTotalHrs.toFixed(2));
    $("#satTotalHrs").text(satTotalHrs.toFixed(2));
    $("#sunTotalHrs").text(sunTotalHrs.toFixed(2));
};

function initializeTotals() {
    monTotalHrs = 0
    tueTotalHrs = 0
    wedTotalHrs = 0
    thuTotalHrs = 0
    friTotalHrs = 0
    satTotalHrs = 0
    sunTotalHrs = 0
};

function minusDailyTotals(taskDay, hourDiff) {
    switch (taskDay) {
        case "Mon":
            monTotalHrs = monTotalHrs - hourDiff;
            return;
        case "Tue":
            tueTotalHrs = tueTotalHrs - hourDiff;
            return;
        case "Wed":
            wedTotalHrs = wedTotalHrs - hourDiff;
            return;
        case "Thu":
            thuTotalHrs = thuTotalHrs - hourDiff;
            return;
        case "Fri":
            friTotalHrs = friTotalHrs - hourDiff;
            return;
        case "Sat":
            satTotalHrs = satTotalHrs - hourDiff;
            return;
        case "Sun":
            sunTotalHrs = sunTotalHrs - hourDiff;
            return;
    };
};