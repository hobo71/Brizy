import React from "react";
import _ from "underscore";
import classnames from "classnames";
import EditorIcon from "visual/component/EditorIcon";

export default class DrawerPopoverItem extends React.Component {
  static defaultProps = {
    className: "",
    label: "",
    icon: "",
    link: "",
    linkTarget: "",
    title: "",
    onClick: _.noop
  };

  handleClick = e => {
    const { link, meta = {}, onClick } = this.props;

    if ((link === "" || link === "#") && meta.popover) {
      meta.popover.close();
    }

    onClick(e);
  };

  render() {
    const {
      className: _className,
      icon,
      label,
      link,
      linkTarget,
      title
    } = this.props;

    const className = classnames("brz-ed-sidebar-bottom__option", _className);

    let content = (
      <React.Fragment>
        {icon && <EditorIcon icon={icon} />}
        {label && <span className="brz-span">{label}</span>}
      </React.Fragment>
    );

    if (link !== "") {
      content = (
        <a href={link} target={linkTarget} className="brz-a">
          {content}
        </a>
      );
    }

    return (
      <div className={className} title={title} onClick={this.handleClick}>
        {content}
      </div>
    );
  }
}
