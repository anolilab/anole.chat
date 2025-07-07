const BlurGradientOverlay = () => {
    const blurLayers = [
        { zIndex: 1, blur: "0.025px", maskGradient: "rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 5%, rgba(0, 0, 0, 0.8) 10%, rgba(0, 0, 0, 0) 20%" },
        { zIndex: 2, blur: "0.05px", maskGradient: "rgba(0, 0, 0, 0) 5%, rgba(0, 0, 0, 0.4) 10%, rgba(0, 0, 0, 0.9) 15%, rgba(0, 0, 0, 0) 25%" },
        { zIndex: 3, blur: "0.1px", maskGradient: "rgba(0, 0, 0, 0) 10%, rgba(0, 0, 0, 0.5) 15%, rgba(0, 0, 0, 1) 20%, rgba(0, 0, 0, 0) 30%" },
        { zIndex: 4, blur: "0.2px", maskGradient: "rgba(0, 0, 0, 0) 15%, rgba(0, 0, 0, 0.6) 20%, rgba(0, 0, 0, 1) 25%, rgba(0, 0, 0, 0) 35%" },
        { zIndex: 5, blur: "0.4px", maskGradient: "rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 0.7) 25%, rgba(0, 0, 0, 1) 30%, rgba(0, 0, 0, 0) 40%" },
        { zIndex: 6, blur: "0.8px", maskGradient: "rgba(0, 0, 0, 0) 25%, rgba(0, 0, 0, 0.8) 30%, rgba(0, 0, 0, 1) 35%, rgba(0, 0, 0, 0) 45%" },
        { zIndex: 7, blur: "1.6px", maskGradient: "rgba(0, 0, 0, 0) 30%, rgba(0, 0, 0, 0.9) 35%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 0) 50%" },
        { zIndex: 8, blur: "3.2px", maskGradient: "rgba(0, 0, 0, 0) 35%, rgba(0, 0, 0, 1) 40%, rgba(0, 0, 0, 1) 45%, rgba(0, 0, 0, 0) 55%" },
        { zIndex: 9, blur: "6.4px", maskGradient: "rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 1) 45%, rgba(0, 0, 0, 1) 50%, rgba(0, 0, 0, 0) 60%" },
    ];

    return (
        <div
            className="pointer-events-none absolute inset-x-0 top-0 ml-2 mr-5 hidden select-none lg:block"
            style={{
                top: 0,
                height: "calc(min(var(--framer-viewport-height, 100%), 100%) / 5)",
                zIndex: 3,
            }}
        >
            <div className="absolute inset-0 overflow-hidden">
                {blurLayers.map((layer, index) => (
                    <div
                        key={index}
                        className="pointer-events-none absolute inset-0 rounded-none"
                        style={{
                            opacity: 1,
                            zIndex: layer.zIndex,
                            maskImage: `linear-gradient(${layer.maskGradient})`,
                            WebkitMaskImage: `linear-gradient(${layer.maskGradient})`,
                            backdropFilter: `blur(${layer.blur})`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default BlurGradientOverlay;
