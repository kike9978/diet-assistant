import { useId, useState } from "react";

const API_BASE_URL = "http://localhost:3000/api";
const STORAGE_KEYS = {
	token: "token",
};

// Login form component
export default function LoginPage({ onLoginSuccess }) {
	const [isRegistering, setIsRegistering] = useState(false);
	const [email, setEmail] = useState("juan2@example.com");
	const [password, setPassword] = useState("123456789");
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const headingId = useId();

	const toggleMode = () => {
		setIsRegistering((prev) => !prev);
		setError("");
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		const endpoint = isRegistering ? "register" : "login";

		try {
			const res = await fetch(`${API_BASE_URL}/auth/${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(
					isRegistering ? { name, email, password } : { email, password },
				),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Request failed");
			}

			const data = await res.json();
			localStorage.setItem(STORAGE_KEYS.token, data.token);
			onLoginSuccess(data.user);
		} catch (err) {
			setError(err.message || "Something went wrong");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex h-screen items-center justify-center bg-gray-100">
			<form
				onSubmit={handleSubmit}
				className="bg-white p-8 rounded shadow-md w-full max-w-sm"
				aria-labelledby={headingId}
			>
				<h2 id={headingId} className="text-2xl font-bold mb-4 text-center">
					{isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
				</h2>

				{error && (
					<div
						className="text-red-500 text-sm mb-4 text-center p-2 bg-red-50 border border-red-200 rounded"
						role="alert"
					>
						{error}
					</div>
				)}

				{isRegistering && (
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Nombre"
						className="w-full p-2 border mb-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
						required
						disabled={isLoading}
						autoComplete="name"
					/>
				)}

				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="Email"
					className="w-full p-2 border mb-3 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
					required
					disabled={isLoading}
					autoComplete="email"
				/>

				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Contraseña"
					className="w-full p-2 border mb-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
					required
					disabled={isLoading}
					autoComplete={isRegistering ? "new-password" : "current-password"}
				/>

				<button
					type="submit"
					className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					disabled={isLoading}
				>
					{isLoading
						? "Procesando..."
						: isRegistering
							? "Registrarse"
							: "Entrar"}
				</button>

				<p className="mt-4 text-sm text-center text-gray-600">
					{isRegistering ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}{" "}
					<button
						type="button"
						onClick={toggleMode}
						className="text-indigo-600 hover:underline ml-1 disabled:opacity-50"
						disabled={isLoading}
					>
						{isRegistering ? "Iniciar sesión" : "Registrarse"}
					</button>
				</p>
			</form>
		</div>
	);
}
