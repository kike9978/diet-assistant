import { t } from "@lingui/core/macro";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Icon overflow menu. Portals the panel so it is not clipped by overflow:auto lists.
 * @param {{
 *   label?: string,
 *   children: import("react").ReactNode,
 *   disabled?: boolean,
 * }} props
 */
export default function OverflowMenu({ label, children, disabled = false }) {
	const [open, setOpen] = useState(false);
	const [coords, setCoords] = useState({ top: 0, right: 0 });
	const buttonRef = useRef(null);
	const menuRef = useRef(null);
	const menuId = useId();

	const updatePosition = () => {
		const button = buttonRef.current;
		if (!button) return;
		const rect = button.getBoundingClientRect();
		const menuHeight = menuRef.current?.offsetHeight ?? 120;
		const spaceBelow = window.innerHeight - rect.bottom;
		const openUp = spaceBelow < menuHeight + 8 && rect.top > menuHeight + 8;
		setCoords({
			top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
			right: Math.max(8, window.innerWidth - rect.right),
		});
	};

	useLayoutEffect(() => {
		if (!open) return;
		updatePosition();
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onPointerDown = (event) => {
			const target = event.target;
			if (buttonRef.current?.contains(target)) return;
			if (menuRef.current?.contains(target)) return;
			setOpen(false);
		};
		const onKeyDown = (event) => {
			if (event.key === "Escape") setOpen(false);
		};
		const onReposition = () => setOpen(false);
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		window.addEventListener("resize", onReposition);
		document.addEventListener("scroll", onReposition, true);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("resize", onReposition);
			document.removeEventListener("scroll", onReposition, true);
		};
	}, [open]);

	return (
		<div className="shrink-0" data-pdf-ignore="">
			<button
				ref={buttonRef}
				type="button"
				disabled={disabled}
				className="inline-flex items-center justify-center min-h-11 min-w-11 -mr-1.5 rounded-app text-ink-muted hover:text-ink hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand)] disabled:opacity-40"
				aria-label={label || t`Más opciones`}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-controls={open ? menuId : undefined}
				onClick={() => {
					if (!open && buttonRef.current) {
						const rect = buttonRef.current.getBoundingClientRect();
						setCoords({
							top: rect.bottom + 4,
							right: Math.max(8, window.innerWidth - rect.right),
						});
					}
					setOpen((value) => !value);
				}}
			>
				<svg
					className="w-5 h-5"
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden
				>
					<circle cx="12" cy="5" r="1.75" />
					<circle cx="12" cy="12" r="1.75" />
					<circle cx="12" cy="19" r="1.75" />
				</svg>
			</button>
			{open
				? createPortal(
						<div
							ref={menuRef}
							id={menuId}
							role="menu"
							style={{ top: coords.top, right: coords.right }}
							className="fixed z-[70] min-w-44 rounded-app border border-border bg-surface shadow-soft py-1"
						>
							{typeof children === "function"
								? children(() => setOpen(false))
								: children}
						</div>,
						document.body,
					)
				: null}
		</div>
	);
}

export function OverflowMenuItem({ onClick, children, danger = false }) {
	return (
		<button
			type="button"
			role="menuitem"
			className={`w-full text-left px-3 py-2.5 min-h-11 text-sm font-semibold hover:bg-surface-2 focus:outline-none focus-visible:bg-surface-2 ${
				danger ? "text-[var(--color-danger)]" : "text-ink"
			}`}
			onClick={onClick}
		>
			{children}
		</button>
	);
}
