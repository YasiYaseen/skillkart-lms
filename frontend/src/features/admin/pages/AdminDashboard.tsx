import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

export function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => {
        setStats(res.data.stats);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load stats");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="text-gray-500">Loading admin stats...</div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { title: "Total Users", value: stats.totalUsers, link: "/admin/users" },
    { title: "Students", value: stats.totalStudents, link: "/admin/users" },
    { title: "Instructors", value: stats.totalInstructors, link: "/admin/users" },
    { title: "Courses", value: stats.totalCourses, link: "/admin/courses" },
    { title: "Enrollments", value: stats.totalEnrollments, link: "/admin/enrollments" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">Platform overview and statistics</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            to={card.link}
            className="block p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-sm font-medium text-gray-500 mb-1">{card.title}</h3>
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
