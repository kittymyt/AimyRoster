using AimyRoster.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace AimyRoster.Controllers
{
    public class HomeController : Controller
    {
        RosterEntities db = new RosterEntities();
        // GET: Home
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult ReadSite()
        {
            var result = db.Site.Select(x => new SiteModelView()
            {
                Id = x.Id,
                Name = x.Name
            }).AsEnumerable();

            return Json(result,JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetStaff(int getSiteId)
        {
            var result = db.StaffAccess.Include("db.Staff").Include("db.Site").Where(x => x.SiteId == getSiteId)
                .Select(x => new StaffModelView()
                {
                    StaffId = x.StaffId,
                    Name = x.Staff.Name,
                    SiteId = x.SiteId,
                    SiteName = x.Site.Name,
                }).AsEnumerable();

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        public ActionResult ReadTask(DateTime weekStart,DateTime weekEnd)
        {
            var result = db.StaffRoster.Include("db.Reference").Where(x => x.StartDate >= weekStart && x.EndDate <= weekEnd)
                    .Select(x => new TaskModelView() {
                        Id = x.Id,
                        StaffId = x.StaffId,
                        SiteId = x.SiteId,
                        StartDate = x.StartDate.ToString(),
                        EndDate = x.EndDate.ToString(),
                        RefName = x.Reference.Name
                    }).AsEnumerable();
            //var result =
            //    (from sr in db.StaffRoster
            //     join si in db.Site on sr.SiteId equals si.Id
            //     join st in db.Staff on sr.StaffId equals st.Id
            //     join refr in db.Reference on sr.RefId equals refr.Id into srRefr
            //     from subRefr in srRefr.DefaultIfEmpty()

            //     where (weekStart <= sr.StartDate && weekEnd >= sr.EndDate)
            //     select new TaskModelView
            //     {
            //         Id = sr.Id,
            //         StaffId = sr.StaffId,
            //         SiteId = sr.SiteId,
            //         StartDate = sr.StartDate.ToString(),
            //         EndDate = sr.EndDate.ToString(),
            //         RefName = subRefr.Name
            //         //SalaryCost = sr.SalaryCost

            //     }).AsEnumerable();

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        public ActionResult ReadExistingTask(int optStaffId, DateTime optStartDate, DateTime optEndDate)
        {
                var result =
               (from sr in db.StaffRoster
                join si in db.Site on sr.SiteId equals si.Id
                join st in db.Staff on sr.StaffId equals st.Id
                where (
                       (sr.StaffId == optStaffId) &&
                       !((sr.EndDate <= optStartDate) || (optEndDate <= sr.StartDate))
                       )
                select new TaskModelView
                {
                    Id = sr.Id,

                }).AsEnumerable();

                return Json(result, JsonRequestBehavior.AllowGet);
                     
        }

        public ActionResult EditRepeatCheck(int optStaffId, DateTime optStartDate, DateTime optEndDate,int dataId)
        {
            var result =
                (from sr in db.StaffRoster
                 join si in db.Site on sr.SiteId equals si.Id
                 join st in db.Staff on sr.StaffId equals st.Id
                 where (
                        (sr.StaffId == optStaffId) && (sr.Id != dataId) && 
                        !((sr.EndDate <= optStartDate) || (optEndDate <= sr.StartDate))
                        )
                 select new TaskModelView
                 {
                     Id = sr.Id,

                 }).AsEnumerable();

            return Json(result, JsonRequestBehavior.AllowGet);
        }


        public ActionResult SaveBooking(TaskModelView[] bookDetails)
        {
            foreach (TaskModelView book in bookDetails)
            {
                
                    var thisBook = new StaffRoster();
                    thisBook.SiteId = book.SiteId;
                    thisBook.StaffId = book.StaffId;
                    thisBook.StartDate = Convert.ToDateTime(book.StartDate);
                    thisBook.EndDate = Convert.ToDateTime(book.EndDate);
                    thisBook.RefId = book.RefId;

                    db.StaffRoster.Add(thisBook);

            }
            db.SaveChanges();           
            return Json(null);
        }


        public ActionResult DeleteBooking(int[] deleteDetails)
        {
            foreach(int widgetId in deleteDetails)
            {
                var deleteWidget = db.StaffRoster.Find(widgetId);
                db.StaffRoster.Remove(deleteWidget);
            }
            db.SaveChanges();
            return null;
        }

        public ActionResult GetReference()
        {
            var result = db.Reference.Select(x => new RefModelView()
            {
                RefId = x.Id,
                RefName = x.Name,
                //RefSiteId = x.SiteId
            }).AsEnumerable();

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        [HttpPost]
        public ActionResult SaveReference(RefModelView newRef)
        {

            //var newRef = new RefModelView(int RefId);
            //newRef.RefId = RefId;
            //newRef.RefName = RefName;

            var saveRef = new Reference();
            saveRef.Name = newRef.RefName;

            db.Reference.Add(saveRef);

            db.SaveChanges();

            return Json(newRef,JsonRequestBehavior.AllowGet);
        }

        public ActionResult FilterSearch(string filterText)
        {

            var searchStaff = db.Staff
                .Where(x => x.Name.Contains(filterText))
                .Select(x => new FilterModelView()
                {
                    FltrId = x.Id,
                    FltrName = x.Name,
                    FltrDisplay = x.Name + " (Staff)",
                    FltrSource = "Staff"
                }).AsEnumerable();

            var searchReference = db.Reference
                .Where(r => r.Name.Contains(filterText))
                .Select(x => new FilterModelView()
                {
                    FltrId = x.Id,
                    FltrName = x.Name,
                    FltrDisplay = x.Name + " (Reference)",
                    FltrSource = "Reference"
                }).AsEnumerable();

            var result = searchStaff.Union(searchReference).OrderBy(y => y.FltrName).AsEnumerable();

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        public ActionResult FilterByStaff(int getSiteId, int getStaffId)
        {
            var result =
                (from sa in db.StaffAccess
                 join si in db.Site on sa.SiteId equals si.Id
                 join st in db.Staff on sa.StaffId equals st.Id
                 where (
                        si.Id == getSiteId &&
                        st.Id == getStaffId
                        )
                 select new StaffModelView
                 {
                     StaffId = st.Id,
                     Name = st.Name,
                     SiteId = si.Id
                 }).AsEnumerable();

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        public ActionResult FilterByRef(DateTime weekStart, DateTime weekEnd, int getReference)
        {
            var result =
                (from sr in db.StaffRoster
                 join si in db.Site on sr.SiteId equals si.Id
                 join st in db.Staff on sr.StaffId equals st.Id
                 join refr in db.Reference on sr.RefId equals refr.Id
                 where (weekStart <= sr.StartDate &&
                        weekEnd >= sr.EndDate &&
                        getReference == refr.Id
                 )
                 select new TaskModelView
                 {
                     Id = sr.Id,
                     StaffId = sr.StaffId,
                     SiteId = sr.SiteId,
                     StartDate = sr.StartDate.ToString(),
                     EndDate = sr.EndDate.ToString(),
                     //SalaryCost = sr.SalaryCost,
                     RefName = refr.Name

                 }).AsEnumerable();

            return Json(result, JsonRequestBehavior.AllowGet);
        }


    }
}