import React from "react";
import EditorComponent from "visual/editorComponents/EditorComponent";
import CustomCSS from "visual/component/CustomCSS";
import { WPShortcode } from "../common/WPShortcode";
import Toolbar from "visual/component/Toolbar";
import * as toolbarConfig from "./toolbar";
import defaultValue from "./defaultValue.json";
import { styleClassName, styleCSSVars } from "./styles";

const resizerPoints = ["centerLeft", "centerRight"];

class WOOAddToCart extends EditorComponent {
  static get componentId() {
    return "WOOAddToCart";
  }

  static defaultValue = defaultValue;

  handleResizerChange = patch => this.patchValue(patch);

  renderForEdit(v) {
    const attributes = {
      id: v.productID,
      style: v.style
    };

    return (
      <Toolbar {...this.makeToolbarPropsFromConfig(toolbarConfig)}>
        <CustomCSS selectorName={this.getId()} css={v.customCSS}>
          <WPShortcode
            name="add_to_cart"
            attributes={attributes}
            placeholderIcon="woo-2"
            className={styleClassName(v)}
            style={styleCSSVars(v)}
            resizerPoints={resizerPoints}
            resizerMeta={this.props.meta}
            resizerValue={v}
            resizerOnChange={this.handleResizerChange}
          />
        </CustomCSS>
      </Toolbar>
    );
  }
}

export default WOOAddToCart;
