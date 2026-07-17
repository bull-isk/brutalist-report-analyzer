"use client";

import type React from "react";
import { X } from "lucide-react";
import { cn } from "../../utils";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
				onClick={onClose}
			/>

			{/* Modal */}
			<div
				className={cn(
					"relative bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/[0.08] max-w-md w-full mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200",
					className
				)}
			>
				{/* Subtle top edge highlight */}
				<div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-white/[0.01]">
					<h3 className="text-lg font-medium text-slate-200 tracking-wide">{title}</h3>
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] hover:shadow-inner transition-all duration-200"
						aria-label="Close modal"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6">
					{children}
				</div>
			</div>
		</div>
	);
};

export default Modal;