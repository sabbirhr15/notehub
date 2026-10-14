// Every page of the app is wired here once, so members only fill in their own feature folder.
// access: undefined = public, "any" = any logged-in user, or a list of roles.
import LoginPage from "./features/fr01-auth/LoginPage.jsx";
import RegisterPage from "./features/fr01-auth/RegisterPage.jsx";
import UploadPage from "./features/fr02-note-upload/UploadPage.jsx";
import BrowsePage from "./features/fr03-browse-search/BrowsePage.jsx";
import NoteDetailsPage from "./features/fr04-note-details/NoteDetailsPage.jsx";
import SavedNotesPage from "./features/fr04-note-details/SavedNotesPage.jsx";
import ApprovalQueuePage from "./features/fr05-approval-queue/ApprovalQueuePage.jsx";
import ReviewerRequestPage from "./features/fr06-reviewer-roles/ReviewerRequestPage.jsx";
import ManageReviewersPage from "./features/fr06-reviewer-roles/ManageReviewersPage.jsx";
import MyNoteReviewsPage from "./features/fr07-reviews/MyNoteReviewsPage.jsx";
import FeedbackPage from "./features/fr08-feedback/FeedbackPage.jsx";
import FeedbackAdminPage from "./features/fr08-feedback/FeedbackAdminPage.jsx";
import PointsPage from "./features/fr09-points/PointsPage.jsx";
import UsagePage from "./features/fr10-usage-limits/UsagePage.jsx";
import CommunitiesPage from "./features/fr11-communities/CommunitiesPage.jsx";
import CommunityDetailPage from "./features/fr11-communities/CommunityDetailPage.jsx";

export const routes = [
  // FR-1
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  // FR-2
  { path: "/upload", element: <UploadPage />, access: "any" },
  // FR-3
  { path: "/", element: <BrowsePage /> },
  // FR-4
  // The details page is public. Like, save and download need a login and are checked on the server.
  { path: "/notes/:id", element: <NoteDetailsPage /> },
  { path: "/saved", element: <SavedNotesPage />, access: "any" },
  // FR-5
  { path: "/review/queue", element: <ApprovalQueuePage />, access: ["reviewer", "admin"] },
  // FR-6
  { path: "/reviewer-request", element: <ReviewerRequestPage />, access: "any" },
  { path: "/admin/reviewers", element: <ManageReviewersPage />, access: ["admin"] },
  // FR-7
  { path: "/my-reviews", element: <MyNoteReviewsPage />, access: "any" },
  // FR-8
  { path: "/feedback", element: <FeedbackPage />, access: "any" },
  { path: "/admin/feedback", element: <FeedbackAdminPage />, access: ["admin"] },
  // FR-9
  { path: "/points", element: <PointsPage />, access: "any" },
  // FR-10
  { path: "/usage", element: <UsagePage />, access: "any" },
  // FR-11
  { path: "/communities", element: <CommunitiesPage />, access: "any" },
  { path: "/communities/:id", element: <CommunityDetailPage />, access: "any" },
  // FR-12 has no page. Its AiSummaryPanel is used inside the upload form (FR-2).
];
