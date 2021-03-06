import React from "react";
import jQuery from "jquery";
import EditorComponent from "visual/editorComponents/EditorComponent";
import CustomCSS from "visual/component/CustomCSS";
import EditorArrayComponent from "visual/editorComponents/EditorArrayComponent";
import Background from "visual/component/Background";
import ContainerBorder from "visual/component/ContainerBorder";
import ThemeIcon from "visual/component/ThemeIcon";
import { CollapsibleToolbar } from "visual/component/Toolbar";
import SortableZIndex from "visual/component/Sortable/SortableZIndex";
import { Roles } from "visual/component/Roles";
import { uuid } from "visual/utils/uuid";
import { stripIds } from "visual/utils/models";
import {
  wInBoxedPage,
  wInTabletPage,
  wInMobilePage,
  wInFullPage
} from "visual/config/columns";
import { createGlobalBlock, createSavedBlock } from "visual/redux/actions";
import { globalBlocksSelector } from "visual/redux/selectors";
import * as toolbarConfig from "./toolbar";
import * as toolbarExtendConfig from "./extendToolbar";
import {
  sectionStyleClassName,
  bgStyleClassName,
  bgStyleCSSVars,
  itemsStyleClassName,
  itemsStyleCSSVars,
  containerStyleClassName,
  containerStyleCSSVars,
  sectionStyleCSSVars
} from "./styles";
import defaultValue from "./defaultValue.json";
import { tabletSyncOnChange, mobileSyncOnChange } from "visual/utils/onChange";

export let SectionPopupInstances = new Map();

class SectionPopup extends EditorComponent {
  static get componentId() {
    return "SectionPopup";
  }

  static defaultProps = {
    meta: {}
  };

  static defaultValue = defaultValue;

  state = {
    isOpened: false
  };

  mounted = false;

  componentDidMount() {
    this.mounted = true;
    SectionPopupInstances.set(this.getId(), this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const stateUpdate = this.state.isOpened !== nextState.isOpened;
    return stateUpdate || this.optionalSCU(nextProps);
  }

  componentWillUnmount() {
    this.mounted = false;
    SectionPopupInstances.delete(this.getId());
    jQuery("html").removeClass("brz-ow-hidden");
  }

  handleToolbarOpen = () => {
    if (this.containerBorder) {
      this.containerBorder.setActive(true);
    }
  };

  handleToolbarClose = () => {
    if (!this.mounted) {
      return;
    }

    if (this.containerBorder) {
      this.containerBorder.setActive(false);
    }

    this.patchValue({
      tabsState: "tabNormal",
      tabsColor: "tabOverlay"
    });
  };

  handleDropClick = () => {
    this.close();
  };

  getMeta(v) {
    const { meta } = this.props;
    const {
      containerSize,
      containerType,
      borderWidthType,
      borderWidth,
      borderLeftWidth,
      borderRightWidth
    } = v;

    const borderWidthW =
      borderWidthType === "grouped"
        ? Number(borderWidth) * 2
        : Number(borderLeftWidth) + Number(borderRightWidth);

    const desktopW =
      containerType === "fullWidth"
        ? wInFullPage - borderWidthW
        : Math.round(
            (wInBoxedPage - borderWidthW) * (containerSize / 100) * 10
          ) / 10;

    const tabletW = wInTabletPage - borderWidthW;
    const mobileW = wInMobilePage - borderWidthW;

    return {
      ...meta,
      tabletW,
      mobileW,
      desktopW,
      sectionPopup: true
    };
  }

  renderToolbar() {
    const { globalBlockId } = this.props.meta;

    return (
      <CollapsibleToolbar
        {...this.makeToolbarPropsFromConfig(toolbarConfig, {
          allowExtend: false
        })}
        className="brz-ed-collapsible__section brz-ed-collapsible--big"
        animation="rightToLeft"
        badge={Boolean(globalBlockId)}
        onOpen={this.handleToolbarOpen}
        onClose={this.handleToolbarClose}
      />
    );
  }

  renderItems(v) {
    const { bgImageSrc, bgColorOpacity, bgPopulation } = v;
    let bgProps = {
      className: bgStyleClassName(v),
      imageSrc: bgImageSrc || bgPopulation,
      colorOpacity: bgColorOpacity,
      tabletImageSrc: tabletSyncOnChange(v, "bgImageSrc"),
      tabletColorOpacity: tabletSyncOnChange(v, "bgColorOpacity"),
      mobileImageSrc: mobileSyncOnChange(v, "bgImageSrc"),
      mobileColorOpacity: mobileSyncOnChange(v, "bgColorOpacity")
    };
    const itemsProps = this.makeSubcomponentProps({
      bindWithKey: "items",
      itemProps: {
        toolbarExtend: this.makeToolbarPropsFromConfig(toolbarExtendConfig, {
          allowExtend: false
        }),
        meta: this.getMeta(v),
        inPopup: true
      }
    });

    return (
      <Background {...bgProps}>
        <SortableZIndex zindex={1}>
          <div className={containerStyleClassName(v)}>
            <div className={itemsStyleClassName(v)}>
              <EditorArrayComponent {...itemsProps} />
            </div>
          </div>
        </SortableZIndex>
      </Background>
    );
  }

  renderForEdit(v) {
    const styles = {
      ...sectionStyleCSSVars(v),
      ...bgStyleCSSVars(v),
      ...itemsStyleCSSVars(v),
      ...containerStyleCSSVars(v)
    };

    return (
      <CustomCSS selectorName={this.getId()} css={v.customCSS}>
        <div
          id={this.getId()}
          className={sectionStyleClassName(v, this.state)}
          style={styles}
          data-block-id={this.props.blockId}
        >
          <div className="brz-popup__close" onClick={this.handleDropClick}>
            <ThemeIcon name="close-popup" type="editor" />
          </div>
          <Roles allow={["admin"]} fallbackRender={() => this.renderItems(v)}>
            <ContainerBorder
              ref={el => {
                this.containerBorder = el;
              }}
              borderStyle="none"
              activeBorderStyle="none"
              reactToClick={false}
              showBorders={false}
              path={this.getPath()}
            >
              {this.renderToolbar(v)}
              {this.renderItems(v)}
            </ContainerBorder>
          </Roles>
        </div>
      </CustomCSS>
    );
  }

  renderForView(v) {
    return (
      <CustomCSS selectorName={this.getId()} css={v.customCSS}>
        <div
          className={sectionStyleClassName(v, this.state)}
          data-brz-popup={this.getId()}
        >
          <div className="brz-popup__close">
            <ThemeIcon name="close-popup" type="editor" />
          </div>
          {this.renderItems(v)}
        </div>
      </CustomCSS>
    );
  }

  open() {
    jQuery("html").addClass("brz-ow-hidden");
    this.setState({
      isOpened: true
    });
  }

  close() {
    jQuery("html").removeClass("brz-ow-hidden");
    this.setState({
      isOpened: false
    });
  }

  // api
  becomeSaved() {
    const { blockId, reduxDispatch } = this.props;
    const dbValue = this.getDBValue();

    reduxDispatch(
      createSavedBlock({
        id: uuid(),
        data: {
          type: "SectionPopup",
          blockId,
          value: dbValue
        }
      })
    );
  }

  becomeGlobal() {
    const { blockId, reduxDispatch, onChange } = this.props;
    const dbValue = this.getDBValue();
    const globalBlockId = uuid();

    reduxDispatch(
      createGlobalBlock({
        id: globalBlockId,
        data: {
          type: "SectionPopup",
          blockId,
          value: dbValue
        }
      })
    );

    onChange(
      {
        type: "GlobalBlock",
        blockId,
        value: {
          _id: this.getId(),
          globalBlockId
        }
      },
      {
        intent: "replace_all",
        idOptions: {
          keepExistingIds: true
        }
      }
    );
  }

  becomeNormal() {
    const {
      meta: { globalBlockId },
      reduxState,
      onChange
    } = this.props;
    const globalBlocks = globalBlocksSelector(reduxState);

    const globalsData = stripIds(globalBlocks[globalBlockId]);
    globalsData.value._id = this.getId();

    onChange(globalsData, {
      intent: "replace_all",
      idOptions: {
        keepExistingIds: true
      }
    });
  }
}

export default SectionPopup;
