import { Plus, Copy } from "lucide-react";

export function MalangaIcon({ className }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden
		>
			<path d="M12 2.5v5" />
			<path d="M12 4.2c-2-1.5-4.2.2-3.6 2.3" />
			<path d="M12 4.2c2-1.5 4.2.2 3.6 2.3" />
			<path d="M8.1 8.4C5.9 10.2 5 12.8 5 15.2 5 18.8 8 21.5 12 21.5s7-2.7 7-6.3c0-2.4-.9-5-3.1-6.8C14.6 7.3 12.8 7 12 7s-2.6.3-3.9 1.4Z" />
			<path d="M6.4 12.6c1.6-.7 3.6-1.1 5.6-1.1s4 .4 5.6 1.1" />
			<path d="M7 16.4c1.4-.5 3.1-.8 5-.8s3.6.3 5 .8" />
		</svg>
	);
}

export function PlusIcon({ className }) {
	return <Plus className={className} aria-hidden />;
}

export function DuplicateIcon({ className }) {
	return <Copy className={className} aria-hidden />;
}
