import type React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// Simple protected route wrapper: if loading, render null; if no user, redirect to /login
export default function ProtectedRoute({
	children,
}: {
	children: React.ReactElement;
}) {
	const { user, loading } = useAuth();
	if (loading) return null;
	if (!user) return <Navigate to="/" replace />;
	return children;
}
