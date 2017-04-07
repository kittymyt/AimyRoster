var siteId;
var gridData;

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
        change: onSelect,
        index:-1
    }).data("kendoDropDownList");




    function onSelect() {
        siteId = this.value();

        if (unsavedTasks.length > 0 || deleteTasks.length > 0) {
            saveChanges();
            updateGridBasedOnSite(siteId);
        } else {
            updateGridBasedOnSite(siteId);
        }
    }

    function updateGridBasedOnSite(siteId) {
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
        var readEndDate = (endDate.getFullYear() + "-" + (endDate.getMonth() + 1) + "-" + (endDate.getDate() + 1));

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
            { field: "Mon" },
            { field: "Tue" },
            { field: "Wed" },
            { field: "Thu" },
            { field: "Fri" },
            { field: "Sat" },
            { field: "Sun" },
        ],
        editable: false,
        scrollable: false,
        noRecords: {
            template: "Please select a site."
        },
    });
});


function LoadTasks(readStartDate,readEndDate) {

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

                var targetcell = "" + value.SiteId + value.StaffId + targetcellStartDate;

                var targetDiv = $('#cell_' + targetcell);
                var columnNum = targetDiv.closest("td").index();

                var div =
                  $("<div class='innerdiv' data-id='" + value.Id + "' col='" + columnNum + "'><span class='planStart'>"
                    + targetStartTime.replace(/^(?:00:)?0?/, '') + "</span> - <span class='planEnd'>"
                    + targetEndTime.replace(/^(?:00:)?0?/, '') + "</span> " + "<div class='glyphicon glyphicon-pencil remove-staff edit-Record'></div>"
                    + "<div class='glyphicon glyphicon-remove'></div>" + "</div>");
                if (targetDiv !== undefined) {
                    targetDiv.append(div);
                }

                //calculate the widget time and add it to the week time
                var dataStaffId = "[data-staffid=" + value.StaffId + "]";
                var existingHours = parseFloat($('div' + dataStaffId).text());

                var hourDiff = timeDiffcalculate(targetStartTime, targetEndTime);

                var newHours = parseFloat(existingHours + hourDiff).toFixed(2);
                $("#scheduler tbody").find(dataStaffId).html(newHours);
            });
        }
    })
};