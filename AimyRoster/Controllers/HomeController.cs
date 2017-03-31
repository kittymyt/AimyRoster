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
            var result = db.Sites.Select(x => new SiteModelView()
            {
                Id = x.Id,
                Name = x.Name
            }).AsEnumerable();

            return Json(result,JsonRequestBehavior.AllowGet);
        }

        public ActionResult GetStaff(int getSiteId)
        {
            var result = db.Staffs.Where(x => x.SiteId == getSiteId)
                .Select(x => new StaffModelView()
                {
                    StaffId = x.Id,
                    Name = x.Name,
                    SiteId = x.SiteId,
                    SiteName = x.SiteName,
                }).AsEnumerable();

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        public ActionResult ReadTask(DateTime weekStart,DateTime weekEnd)
        {
            var result =
                (from sr in db.StaffRoster
                 join si in db.Sites on sr.SiteId equals si.Id
                 join st in db.Staffs on sr.StaffId equals st.Id
                 where(weekStart <= sr.StartDate && weekEnd >= sr.EndDate)
                 select new TaskModelView
                 {
                     Id = sr.Id,
                     StaffId = sr.StaffId,
                     SiteId = sr.SiteId,
                     StartDate = sr.StartDate.ToString(),
                     EndDate = sr.EndDate.ToString(),
                     //SalaryCost = sr.SalaryCost

                 }).AsEnumerable();

            return Json(result, JsonRequestBehavior.AllowGet);
        }

        public ActionResult ReadExistingTask(int optStaffId, DateTime optStartDate, DateTime optEndDate)
        {
            var result =
                (from sr in db.StaffRoster
                 join si in db.Sites on sr.SiteId equals si.Id
                 join st in db.Staffs on sr.StaffId equals st.Id
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


        public ActionResult SaveBooking(TaskModelView[] bookDetails)
        {
            foreach (TaskModelView book in bookDetails)
            {
                var thisBook = new StaffRoster();
                thisBook.SiteId = book.SiteId;
                thisBook.StaffId = book.StaffId;
                thisBook.StartDate = Convert.ToDateTime(book.StartDate);
                thisBook.EndDate = Convert.ToDateTime(book.EndDate);
                
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
    }
}