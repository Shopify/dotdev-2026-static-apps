import { render } from 'preact';
import { LocationProvider, ErrorBoundary, Router, Route } from 'preact-iso';

import HomePage from './pages/HomePage.jsx'
import OfferPage from './pages/OfferPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default async () => {
  render(<App />, document.body);
};

function App() {
  return (
    <LocationProvider>
      <ErrorBoundary>
        <Router>
          <Route path="/" component={HomePage} />
          <Route path="/offer/:id" component={OfferPage} />
          <Route default component={NotFoundPage} />
        </Router>
      </ErrorBoundary>
    </LocationProvider>
  );
}
