
const Errorpage = () => {
    return (
        <section className="mint-app-bg flex min-h-screen items-center">
            <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6 w-full">
                <div className="liquid-glass mx-auto max-w-xl rounded-[36px] p-8 text-center sm:p-12">
                    <p className="eyebrow">404 · Off the map</p>
                    <h1 className="text-gradient mt-4 text-5xl font-semibold tracking-[-.06em] sm:text-7xl">
                        Lost in conversation?
                    </h1>
                    <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-text-secondary">
                        The page you requested is no longer here, or the link may be incorrect.
                    </p>
                    <a
                        href="/"
                        className="mint-button mt-7 inline-flex rounded-full px-5 py-2.5 text-sm font-semibold"
                    >
                        Back to Homepage
                    </a>
                </div>
            </div>
        </section>
    )
}

export default Errorpage;
