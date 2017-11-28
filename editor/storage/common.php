<?php if ( ! defined( 'ABSPATH' ) ) {
	die( 'Direct access forbidden.' );
}

class Brizy_Editor_Storage_Common extends Brizy_Editor_Storage_Abstract {

	/**
	 * @return Brizy_Editor_Storage_Common
	 */
	public static function instance() {
		static $instance;

		return $instance ? $instance : $instance = new Brizy_Editor_Storage_Common();
	}

	/**
	 * @return array
	 */
	protected function get_storage() {
		return (array) get_option( $this->key(), array() );
	}

	/**
	 * @param array $storage
	 *
	 * @return $this
	 */
	protected function update_storage( array $storage ) {
		update_option( $this->key(), $storage );

		return $this;
	}

	protected function key() {
		return 'brizy';
	}
}