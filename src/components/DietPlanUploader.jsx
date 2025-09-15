import { useEffect, useState } from "react";
import { STORAGE_KEYS, useLocalStorage } from "../hooks/useLocalStorage";

function DietPlanUploader({ onUpload }) {
	const { getItem } = useLocalStorage();
	const [jsonInput, setJsonInput] = useState("");
	const [error, setError] = useState(null);
	const [showExample, setShowExample] = useState(false);
	const [uploadMode, setUploadMode] = useState("json"); // 'json' or 'file'
	const [selectedFile, setSelectedFile] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [pastedImage, setPastedImage] = useState(null);

	const handleJsonSubmit = () => {
		try {
			const plan = JSON.parse(jsonInput);
			if (validateDietPlan(plan)) {
				onUpload(plan);
				setError(null);
			} else {
				setError(
					"Invalid diet plan format. Please check the example for the correct format.",
				);
			}
		} catch {
			setError("Invalid JSON. Please check your syntax.");
		}
	};

	const handleFileUpload = async () => {
		const fileToUpload = selectedFile || pastedImage?.file;
		if (!fileToUpload) {
			setError("Please select a file to upload or paste an image.");
			return;
		}

		setIsProcessing(true);
		setError(null);

		try {
			const formData = new FormData();
			formData.append("file", fileToUpload);

			const token = getItem(STORAGE_KEYS.token);
			console.log("🔍 Debug - Token from localStorage:", token);
			console.log("🔍 Debug - Token exists:", !!token);
			console.log("🔍 Debug - Token length:", token?.length);

			if (!token) {
				setError("Authentication required. Please log in first.");
				return;
			}

			const response = await fetch("/api/process-diet-plan-file", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
				body: formData,
			});

			console.log("🔍 Debug - Response status:", response.status);
			console.log(
				"🔍 Debug - Response headers:",
				Object.fromEntries(response.headers.entries()),
			);

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to process file");
			}

			if (result.success && result.dietPlan) {
				onUpload(result.dietPlan);
			} else {
				setError("Failed to generate diet plan from the uploaded file.");
			}
		} catch (err) {
			setError(
				err.message || "Failed to process the uploaded file. Please try again.",
			);
		} finally {
			setIsProcessing(false);
		}
	};

	const handleFileChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const allowedTypes = [
				"image/jpeg",
				"image/png",
				"image/gif",
				"image/webp",
				"application/pdf",
			];
			if (!allowedTypes.includes(file.type)) {
				setError(
					"Invalid file type. Only images (JPEG, PNG, GIF, WebP) and PDFs are supported.",
				);
				setSelectedFile(null);
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				setError("File size too large. Maximum size is 10MB.");
				setSelectedFile(null);
				return;
			}
			setSelectedFile(file);
			setError(null);
		}
	};

	// Handle paste events for images
	useEffect(() => {
		const handlePaste = async (e) => {
			// Only handle paste in file upload mode
			if (uploadMode !== "file") return;

			const items = e.clipboardData?.items;
			if (!items) return;

			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (item.type.indexOf("image") !== -1) {
					e.preventDefault();

					const file = item.getAsFile();
					if (file) {
						// Validate file size (10MB limit)
						if (file.size > 10 * 1024 * 1024) {
							setError("Pasted image is too large. Maximum size is 10MB.");
							return;
						}

						// Create a preview URL for display
						const previewUrl = URL.createObjectURL(file);

						// Set the pasted image with preview
						setPastedImage({
							file: file,
							previewUrl: previewUrl,
							name: `Pasted Image (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
						});

						// Clear any previous selected file
						setSelectedFile(null);
						setError(null);
					}
					break; // Only handle the first image
				}
			}
		};

		document.addEventListener("paste", handlePaste);
		return () => document.removeEventListener("paste", handlePaste);
	}, [uploadMode]);

	// Clear pasted image when switching modes
	useEffect(() => {
		if (uploadMode !== "file") {
			setPastedImage(null);
		}
	}, [uploadMode]);

	// Cleanup pasted image URLs on unmount
	useEffect(() => {
		return () => {
			if (pastedImage?.previewUrl) {
				URL.revokeObjectURL(pastedImage.previewUrl);
			}
		};
	}, [pastedImage?.previewUrl]);

	const validateDietPlan = (plan) => {
		// Check if the plan has days
		if (!plan.days || !Array.isArray(plan.days) || plan.days.length === 0) {
			return false;
		}

		// Check if each day has the required properties
		for (const day of plan.days) {
			if (!day.id || !day.name || !day.meals || !Array.isArray(day.meals)) {
				return false;
			}

			// Check if each meal has the required properties
			for (const meal of day.meals) {
				if (
					!meal.id ||
					!meal.name ||
					!meal.ingredients ||
					!Array.isArray(meal.ingredients)
				) {
					return false;
				}

				// Check if each ingredient has the required properties
				for (const ingredient of meal.ingredients) {
					if (!ingredient.name || !ingredient.quantity) {
						return false;
					}
				}
			}
		}

		return true;
	};

	const handleSampleData = () => {
		const sampleData = {
			days: [
				{
					id: "day1",
					name: "Day 1",
					meals: [
						{
							id: "meal1",
							name: "Breakfast: Oatmeal with Fruits",
							ingredients: [
								{ name: "Rolled Oats", quantity: "1/2 cup" },
								{ name: "Banana", quantity: "1" },
								{ name: "Berries", quantity: "1/2 cup" },
								{ name: "Honey", quantity: "1 tbsp" },
								{ name: "Almond Milk", quantity: "1 cup" },
							],
						},
						{
							id: "meal2",
							name: "Lunch: Chicken Salad",
							ingredients: [
								{ name: "Chicken Breast", quantity: "150g" },
								{ name: "Mixed Greens", quantity: "2 cups" },
								{ name: "Cherry Tomatoes", quantity: "1/2 cup" },
								{ name: "Cucumber", quantity: "1/2" },
								{ name: "Olive Oil", quantity: "1 tbsp" },
								{ name: "Lemon", quantity: "1/2" },
							],
						},
						{
							id: "meal3",
							name: "Dinner: Salmon with Vegetables",
							ingredients: [
								{ name: "Salmon Fillet", quantity: "150g" },
								{ name: "Broccoli", quantity: "1 cup" },
								{ name: "Carrots", quantity: "1/2 cup" },
								{ name: "Brown Rice", quantity: "1/2 cup" },
								{ name: "Olive Oil", quantity: "1 tbsp" },
								{ name: "Lemon", quantity: "1/2" },
							],
						},
					],
				},
				{
					id: "day2",
					name: "Day 2",
					meals: [
						{
							id: "meal4",
							name: "Breakfast: Avocado Toast",
							ingredients: [
								{ name: "Whole Grain Bread", quantity: "2 slices" },
								{ name: "Avocado", quantity: "1" },
								{ name: "Eggs", quantity: "2" },
								{ name: "Cherry Tomatoes", quantity: "1/4 cup" },
								{ name: "Salt and Pepper", quantity: "to taste" },
							],
						},
						{
							id: "meal5",
							name: "Lunch: Quinoa Bowl",
							ingredients: [
								{ name: "Quinoa", quantity: "1/2 cup" },
								{ name: "Black Beans", quantity: "1/2 cup" },
								{ name: "Corn", quantity: "1/4 cup" },
								{ name: "Avocado", quantity: "1/2" },
								{ name: "Lime", quantity: "1/2" },
								{ name: "Cilantro", quantity: "2 tbsp" },
							],
						},
						{
							id: "meal6",
							name: "Dinner: Turkey Meatballs",
							ingredients: [
								{ name: "Ground Turkey", quantity: "150g" },
								{ name: "Zucchini Noodles", quantity: "2 cups" },
								{ name: "Tomato Sauce", quantity: "1/2 cup" },
								{ name: "Parmesan Cheese", quantity: "2 tbsp" },
								{ name: "Garlic", quantity: "2 cloves" },
							],
						},
					],
				},
			],
		};

		setJsonInput(JSON.stringify(sampleData, null, 2));
		setError(null);
	};

	const exampleJson = `{
  "days": [
    {
      "id": "day1",
      "name": "Day 1",
      "meals": [
        {
          "id": "meal1",
          "name": "Breakfast: Oatmeal with Fruits",
          "ingredients": [
            { "name": "Rolled Oats", "quantity": "1/2 cup" },
            { "name": "Banana", "quantity": "1" },
            { "name": "Berries", "quantity": "1/2 cup" }
          ]
        },
        {
          "id": "meal2",
          "name": "Lunch: Chicken Salad",
          "ingredients": [
            { "name": "Chicken Breast", "quantity": "150g" },
            { "name": "Mixed Greens", "quantity": "2 cups" },
            { "name": "Olive Oil", "quantity": "1 tbsp" }
          ]
        }
      ]
    }
  ]
}`;

	return (
		<div className="bg-white p-6 rounded-lg shadow-md">
			<h2 className="text-2xl font-bold mb-4">Upload Your Diet Plan</h2>
			<p className="mb-6 text-gray-600">
				Choose how to upload your diet plan: paste JSON directly or upload an
				image/PDF for automatic processing.
			</p>

			{/* Mode Selection Tabs */}
			<div className="flex mb-6 border-b">
				<button
					type="button"
					onClick={() => setUploadMode("json")}
					className={`px-4 py-2 font-medium text-sm ${
						uploadMode === "json"
							? "border-b-2 border-indigo-500 text-indigo-600"
							: "text-gray-500 hover:text-gray-700"
					}`}
				>
					JSON Input
				</button>
				<button
					type="button"
					onClick={() => setUploadMode("file")}
					className={`px-4 py-2 font-medium text-sm ${
						uploadMode === "file"
							? "border-b-2 border-indigo-500 text-indigo-600"
							: "text-gray-500 hover:text-gray-700"
					}`}
				>
					File Upload (AI Processing)
				</button>
			</div>

			{uploadMode === "json" ? (
				<>
					<div className="mb-6">
						<div className="flex justify-between items-center mb-2">
							<label className="block text-sm font-medium text-gray-700">
								Diet Plan JSON
							</label>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setShowExample(!showExample)}
									className="text-sm text-indigo-600 hover:text-indigo-800"
								>
									{showExample ? "Hide Example" : "Show Example"}
								</button>
								<a
									href="https://chat.deepseek.com/a/chat/s/46cbbfea-1c52-4511-97c9-8ede6a60d959"
									target="_blank"
									className="text-sm text-indigo-600 hover:text-indigo-800"
									rel="noopener"
								>
									JSON Generator
								</a>
							</div>
						</div>

						{showExample && (
							<div className="mb-4 p-4 bg-gray-50 rounded-md overflow-auto max-h-60">
								<pre className="text-xs text-gray-700">{exampleJson}</pre>
							</div>
						)}

						<textarea
							value={jsonInput}
							onChange={(e) => setJsonInput(e.target.value)}
							className="w-full h-64 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
							placeholder="Paste your diet plan JSON here..."
						/>
					</div>

					<div className="flex justify-between">
						<button
							type="button"
							onClick={handleSampleData}
							className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
						>
							Use Sample Data
						</button>

						<button
							type="button"
							onClick={handleJsonSubmit}
							className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
						>
							Submit JSON
						</button>
					</div>
				</>
			) : (
				<>
					<div className="mb-6">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Upload or Paste Image/PDF
						</label>
						<p className="text-sm text-gray-500 mb-4">
							Upload a meal plan image (JPEG, PNG, GIF, WebP) or PDF for
							automatic processing with AI, or simply paste an image from your
							clipboard. Maximum file size: 10MB.
						</p>

						{/* Show selected or pasted file */}
						{(selectedFile || pastedImage) && (
							<div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
								<div className="flex items-center justify-between">
									<div className="flex items-center">
										{selectedFile && (
											<div>
												<p className="font-medium text-green-800">
													📁 {selectedFile.name}
												</p>
												<p className="text-sm text-green-600">
													{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
												</p>
											</div>
										)}
										{pastedImage && (
											<div>
												<p className="font-medium text-green-800">
													📋 {pastedImage.name}
												</p>
												{pastedImage.previewUrl && (
													<img
														src={pastedImage.previewUrl}
														alt="Pasted"
														className="mt-2 max-w-32 max-h-32 object-cover rounded border"
													/>
												)}
											</div>
										)}
									</div>
									<button
										type="button"
										onClick={() => {
											setSelectedFile(null);
											setPastedImage(null);
											// Clear the file input
											const fileInput = document.getElementById("fileInput");
											if (fileInput) fileInput.value = "";
										}}
										className="text-red-500 hover:text-red-700 text-sm"
									>
										✕ Remove
									</button>
								</div>
							</div>
						)}

						{/* Upload area */}
						{!selectedFile && !pastedImage && (
							<div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
								<input
									type="file"
									accept="image/*,.pdf"
									onChange={handleFileChange}
									className="hidden"
									id="fileInput"
								/>
								<label
									htmlFor="fileInput"
									className="cursor-pointer text-indigo-600 hover:text-indigo-800"
								>
									<div>
										<p className="font-medium">Click to select file</p>
										<p className="text-sm text-gray-500">or drag and drop</p>
										<p className="text-xs text-gray-400 mt-1">
											You can also paste images directly (Ctrl+V)
										</p>
									</div>
								</label>
							</div>
						)}
					</div>

					<div className="flex justify-end">
						<button
							type="button"
							onClick={handleFileUpload}
							disabled={(!selectedFile && !pastedImage) || isProcessing}
							className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isProcessing ? "Processing..." : "Process with AI"}
						</button>
					</div>
				</>
			)}

			{error && (
				<div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
					{error}
				</div>
			)}
		</div>
	);
}

export default DietPlanUploader;
