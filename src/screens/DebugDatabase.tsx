import React, { useState } from "react";
import { supabase } from "../db";

function DebugDatabase() {
	const [tables, setTables] = useState<any[]>([]);
	const [chatsSchema, setChatsSchema] = useState<any[]>([]);
	const [roomsSchema, setRoomsSchema] = useState<any[]>([]);
	const [sampleChats, setSampleChats] = useState<any[]>([]);
	const [sampleRooms, setSampleRooms] = useState<any[]>([]);

	const checkDatabase = async () => {
		console.log("🔍 Checking database schema...");

		// 테이블 목록 확인
		try {
			const { data: tablesData, error: tablesError } = await supabase
				.from("information_schema.tables")
				.select("table_name")
				.eq("table_schema", "public");

			if (tablesError) {
				console.error("Tables query error:", tablesError);
			} else {
				console.log("📋 Available tables:", tablesData);
				setTables(tablesData || []);
			}
		} catch (err) {
			console.error("Failed to get tables:", err);
		}

		// chats 테이블 스키마
		try {
			const { data: chatsData, error: chatsError } = await supabase
				.from("information_schema.columns")
				.select("column_name, data_type, is_nullable, column_default")
				.eq("table_name", "chats")
				.eq("table_schema", "public");

			if (chatsError) {
				console.error("Chats schema error:", chatsError);
			} else {
				console.log("📊 Chats schema:", chatsData);
				setChatsSchema(chatsData || []);
			}
		} catch (err) {
			console.error("Failed to get chats schema:", err);
		}

		// rooms 테이블 스키마
		try {
			const { data: roomsData, error: roomsError } = await supabase
				.from("information_schema.columns")
				.select("column_name, data_type, is_nullable, column_default")
				.eq("table_name", "rooms")
				.eq("table_schema", "public");

			if (roomsError) {
				console.error("Rooms schema error:", roomsError);
			} else {
				console.log("📊 Rooms schema:", roomsData);
				setRoomsSchema(roomsData || []);
			}
		} catch (err) {
			console.error("Failed to get rooms schema:", err);
		}

		// 샘플 데이터
		try {
			const { data: chatsExample, error: chatsExampleError } = await supabase
				.from("chats")
				.select("*")
				.limit(3);

			if (!chatsExampleError) {
				console.log("💬 Sample chats:", chatsExample);
				setSampleChats(chatsExample || []);
			}
		} catch (err) {
			console.error("Failed to get sample chats:", err);
		}

		try {
			const { data: roomsExample, error: roomsExampleError } = await supabase
				.from("rooms")
				.select("*")
				.limit(3);

			if (!roomsExampleError) {
				console.log("🏠 Sample rooms:", roomsExample);
				setSampleRooms(roomsExample || []);
			}
		} catch (err) {
			console.error("Failed to get sample rooms:", err);
		}
	};

	return (
		<div style={{ padding: "2rem", fontFamily: "monospace" }}>
			<h2>🔍 Database Schema Debug</h2>

			<button
				onClick={checkDatabase}
				style={{ padding: "0.5rem 1rem", marginBottom: "2rem" }}
			>
				데이터베이스 스키마 확인
			</button>

			<div style={{ display: "grid", gap: "2rem" }}>
				{/* 테이블 목록 */}
				<div>
					<h3>📋 Available Tables</h3>
					<div
						style={{
							border: "1px solid #ccc",
							padding: "1rem",
							backgroundColor: "#f9f9f9",
						}}
					>
						{tables.length === 0 ? (
							<div>아직 확인되지 않음</div>
						) : (
							tables.map((table, idx) => (
								<div key={idx}>{table.table_name}</div>
							))
						)}
					</div>
				</div>

				{/* chats 스키마 */}
				<div>
					<h3>💬 Chats Table Schema</h3>
					<div
						style={{
							border: "1px solid #ccc",
							padding: "1rem",
							backgroundColor: "#f9f9f9",
						}}
					>
						{chatsSchema.length === 0 ? (
							<div>아직 확인되지 않음</div>
						) : (
							<table style={{ width: "100%", borderCollapse: "collapse" }}>
								<thead>
									<tr>
										<th style={{ border: "1px solid #ddd", padding: "8px" }}>
											Column
										</th>
										<th style={{ border: "1px solid #ddd", padding: "8px" }}>
											Type
										</th>
										<th style={{ border: "1px solid #ddd", padding: "8px" }}>
											Nullable
										</th>
										<th style={{ border: "1px solid #ddd", padding: "8px" }}>
											Default
										</th>
									</tr>
								</thead>
								<tbody>
									{chatsSchema.map((col, idx) => (
										<tr key={idx}>
											<td style={{ border: "1px solid #ddd", padding: "8px" }}>
												{col.column_name}
											</td>
											<td style={{ border: "1px solid #ddd", padding: "8px" }}>
												{col.data_type}
											</td>
											<td style={{ border: "1px solid #ddd", padding: "8px" }}>
												{col.is_nullable}
											</td>
											<td style={{ border: "1px solid #ddd", padding: "8px" }}>
												{col.column_default || "NULL"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>

				{/* rooms 스키마 */}
				<div>
					<h3>🏠 Rooms Table Schema</h3>
					<div
						style={{
							border: "1px solid #ccc",
							padding: "1rem",
							backgroundColor: "#f9f9f9",
						}}
					>
						{roomsSchema.length === 0 ? (
							<div>아직 확인되지 않음</div>
						) : (
							<table style={{ width: "100%", borderCollapse: "collapse" }}>
								<thead>
									<tr>
										<th style={{ border: "1px solid #ddd", padding: "8px" }}>
											Column
										</th>
										<th style={{ border: "1px solid #ddd", padding: "8px" }}>
											Type
										</th>
										<th style={{ border: "1px solid #ddd", padding: "8px" }}>
											Nullable
										</th>
										<th style={{ border: "1px solid #ddd", padding: "8px" }}>
											Default
										</th>
									</tr>
								</thead>
								<tbody>
									{roomsSchema.map((col, idx) => (
										<tr key={idx}>
											<td style={{ border: "1px solid #ddd", padding: "8px" }}>
												{col.column_name}
											</td>
											<td style={{ border: "1px solid #ddd", padding: "8px" }}>
												{col.data_type}
											</td>
											<td style={{ border: "1px solid #ddd", padding: "8px" }}>
												{col.is_nullable}
											</td>
											<td style={{ border: "1px solid #ddd", padding: "8px" }}>
												{col.column_default || "NULL"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</div>

				{/* 샘플 데이터 */}
				<div>
					<h3>📋 Sample Data</h3>
					<div>
						<h4>💬 Sample Chats:</h4>
						<pre
							style={{
								backgroundColor: "#f5f5f5",
								padding: "1rem",
								overflow: "auto",
							}}
						>
							{JSON.stringify(sampleChats, null, 2)}
						</pre>

						<h4>🏠 Sample Rooms:</h4>
						<pre
							style={{
								backgroundColor: "#f5f5f5",
								padding: "1rem",
								overflow: "auto",
							}}
						>
							{JSON.stringify(sampleRooms, null, 2)}
						</pre>
					</div>
				</div>
			</div>
		</div>
	);
}

export default DebugDatabase;
