import React, { useEffect, useState } from "react";
import { supabase } from "../db";

function DbTest() {
	const [results, setResults] = useState<any>({});
	const [loading, setLoading] = useState(false);

	const testDatabase = async () => {
		setLoading(true);
		const testResults: any = {};

		try {
			// 1. questions 테이블 확인
			console.log("Testing questions table...");
			const { data: questions, error: questionsError } = await supabase
				.from("questions")
				.select("*")
				.limit(1);

			testResults.questions = {
				success: !questionsError,
				error: questionsError?.message,
				data: questions,
			};

			// 2. rooms 테이블 확인
			console.log("Testing rooms table...");
			const { data: rooms, error: roomsError } = await supabase
				.from("rooms")
				.select("*")
				.limit(1);

			testResults.rooms = {
				success: !roomsError,
				error: roomsError?.message,
				data: rooms,
			};

			// 3. profiles 테이블 확인
			console.log("Testing profiles table...");
			const { data: profiles, error: profilesError } = await supabase
				.from("profiles")
				.select("*")
				.limit(1);

			testResults.profiles = {
				success: !profilesError,
				error: profilesError?.message,
				data: profiles,
			};

			// 4. chats 테이블 확인
			console.log("Testing chats table...");
			const { data: chats, error: chatsError } = await supabase
				.from("chats")
				.select("*")
				.limit(1);

			testResults.chats = {
				success: !chatsError,
				error: chatsError?.message,
				data: chats,
			};

			console.log("Database test results:", testResults);
			setResults(testResults);
		} catch (error: any) {
			console.error("Database test error:", error);
			testResults.general = {
				success: false,
				error: error.message,
			};
			setResults(testResults);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		testDatabase();
	}, []);

	return (
		<div style={{ padding: "20px", fontFamily: "monospace" }}>
			<h2>Database Connection Test</h2>
			{loading ? (
				<p>Testing database connections...</p>
			) : (
				<div>
					{Object.entries(results).map(([table, result]: [string, any]) => (
						<div
							key={table}
							style={{
								margin: "10px 0",
								padding: "10px",
								border: `2px solid ${result.success ? "green" : "red"}`,
								borderRadius: "5px",
							}}
						>
							<h3>{table} Table</h3>
							<p>Status: {result.success ? "✅ Success" : "❌ Failed"}</p>
							{result.error && (
								<p style={{ color: "red" }}>Error: {result.error}</p>
							)}
							{result.data && (
								<details>
									<summary>Sample Data</summary>
									<pre>{JSON.stringify(result.data, null, 2)}</pre>
								</details>
							)}
						</div>
					))}
					<button
						onClick={testDatabase}
						style={{
							padding: "10px 20px",
							background: "#007bff",
							color: "white",
							border: "none",
							borderRadius: "5px",
							cursor: "pointer",
						}}
					>
						Re-test Database
					</button>
				</div>
			)}
		</div>
	);
}

export default DbTest;
