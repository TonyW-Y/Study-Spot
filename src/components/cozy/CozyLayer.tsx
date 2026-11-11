import Companion from "@/components/companion/Companion";
import CozyDock from "./CozyDock";

/** Everything that floats above the pages: the support animal and the cozy tool dock */
const CozyLayer = () => (
  <>
    <Companion />
    <CozyDock />
  </>
);

export default CozyLayer;
