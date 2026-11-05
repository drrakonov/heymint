import BrandLogo from '../BrandLogo';
import './Loader.css';

const Loader = () => (
  <div role="status" aria-live="polite" className="heymint-loader">
    <div className="heymint-loader__signal" aria-hidden="true">
      <span className="heymint-loader__ring"/>
      <span className="heymint-loader__ring heymint-loader__ring--outer"/>
      <span className="heymint-loader__orbit"><i/></span>
      <span className="heymint-loader__seed"><img src="/heymint-icon.svg" alt=""/></span>
      <div className="heymint-loader__wave">
        {[12, 22, 32, 18, 28, 22, 12].map((height, index) => (
          <i key={index} style={{ height, animationDelay: `${index * -0.14}s` }}/>
        ))}
      </div>
    </div>
    <BrandLogo className="w-32"/>
    <p className="heymint-loader__label">Making room for you<span aria-hidden="true">…</span></p>
    <span className="sr-only">Loading HeyMint. Please wait.</span>
  </div>
);
export default Loader;
