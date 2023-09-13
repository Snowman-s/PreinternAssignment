import "../styles/globals.css"

const MyApp = ({ Component, pageProps }) => {
    return <div className="m-4"> <Component {...pageProps} /></div>
}
export default MyApp